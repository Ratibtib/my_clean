-- ============================================================
-- CHORIFY — Schéma Supabase (PostgreSQL)
-- ============================================================

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABLES
-- ============================================================

-- Foyers
CREATE TABLE households (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Profils utilisateurs (lié à auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url  TEXT,
  push_token  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Appartenance foyer ↔ utilisateur
CREATE TABLE household_memberships (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, household_id)
);

-- Cibles (zones + équipements)
CREATE TABLE targets (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id  UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('zone', 'equipment')),
  parent_id     UUID REFERENCES targets(id) ON DELETE SET NULL,
  position_x    REAL DEFAULT 0,
  position_y    REAL DEFAULT 0,
  icon          TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Types de tâche
CREATE TABLE task_types (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Seed quelques types par défaut
INSERT INTO task_types (name, icon) VALUES
  ('Nettoyer', 'spray-can'),
  ('Aspirer', 'wind'),
  ('Ranger', 'archive'),
  ('Laver', 'droplets'),
  ('Dépoussiérer', 'feather'),
  ('Désinfecter', 'shield-check'),
  ('Vider', 'trash-2'),
  ('Repasser', 'shirt');

-- Définitions de tâche
CREATE TABLE task_definitions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id      UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  task_type_id      UUID NOT NULL REFERENCES task_types(id) ON DELETE CASCADE,
  target_id         UUID NOT NULL REFERENCES targets(id) ON DELETE CASCADE,
  max_interval_days INTEGER NOT NULL DEFAULT 7 CHECK (max_interval_days > 0),
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, task_type_id, target_id)
);

-- Réalisations de tâche
CREATE TABLE task_completions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_definition_id  UUID NOT NULL REFERENCES task_definitions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================

CREATE INDEX idx_targets_household ON targets(household_id);
CREATE INDEX idx_targets_parent ON targets(parent_id);
CREATE INDEX idx_task_definitions_household ON task_definitions(household_id);
CREATE INDEX idx_task_definitions_target ON task_definitions(target_id);
CREATE INDEX idx_task_completions_definition ON task_completions(task_definition_id);
CREATE INDEX idx_task_completions_user ON task_completions(user_id);
CREATE INDEX idx_task_completions_date ON task_completions(completed_at DESC);
CREATE INDEX idx_household_memberships_user ON household_memberships(user_id);

-- ============================================================
-- 3. VUES
-- ============================================================

-- Vue enrichie : dernière réalisation par tâche
CREATE OR REPLACE VIEW task_status_view AS
SELECT
  td.id AS task_definition_id,
  td.household_id,
  td.max_interval_days,
  td.created_at AS definition_created_at,
  tt.name AS task_type_name,
  tt.icon AS task_type_icon,
  t.name AS target_name,
  t.type AS target_type,
  t.parent_id AS target_parent_id,
  t.position_x,
  t.position_y,
  lc.last_completed_at,
  lc.last_completed_by,
  -- Calcul du ratio d'avancement
  CASE
    WHEN lc.last_completed_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (now() - lc.last_completed_at)) /
      (td.max_interval_days * 86400.0)
    ELSE
      EXTRACT(EPOCH FROM (now() - td.created_at)) /
      (td.max_interval_days * 86400.0)
  END AS progress_ratio,
  -- Statut dérivé
  CASE
    WHEN (
      CASE
        WHEN lc.last_completed_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (now() - lc.last_completed_at)) /
          (td.max_interval_days * 86400.0)
        ELSE
          EXTRACT(EPOCH FROM (now() - td.created_at)) /
          (td.max_interval_days * 86400.0)
      END
    ) <= 0.6 THEN 'green'
    WHEN (
      CASE
        WHEN lc.last_completed_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (now() - lc.last_completed_at)) /
          (td.max_interval_days * 86400.0)
        ELSE
          EXTRACT(EPOCH FROM (now() - td.created_at)) /
          (td.max_interval_days * 86400.0)
      END
    ) <= 0.9 THEN 'orange'
    ELSE 'red'
  END AS status
FROM task_definitions td
JOIN task_types tt ON tt.id = td.task_type_id
JOIN targets t ON t.id = td.target_id
LEFT JOIN LATERAL (
  SELECT
    tc.completed_at AS last_completed_at,
    tc.user_id AS last_completed_by
  FROM task_completions tc
  WHERE tc.task_definition_id = td.id
  ORDER BY tc.completed_at DESC
  LIMIT 1
) lc ON true;

-- ============================================================
-- 4. FONCTIONS RPC
-- ============================================================

-- Calcul du streak global d'un foyer
CREATE OR REPLACE FUNCTION get_household_streak(p_household_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_red BOOLEAN;
BEGIN
  LOOP
    -- Vérifier s'il y avait des tâches en rouge ce jour-là
    SELECT EXISTS (
      SELECT 1
      FROM task_definitions td
      LEFT JOIN LATERAL (
        SELECT tc.completed_at
        FROM task_completions tc
        WHERE tc.task_definition_id = td.id
          AND tc.completed_at <= (check_date + INTERVAL '1 day')
        ORDER BY tc.completed_at DESC
        LIMIT 1
      ) lc ON true
      WHERE td.household_id = p_household_id
        AND (
          CASE
            WHEN lc.completed_at IS NOT NULL THEN
              EXTRACT(EPOCH FROM (check_date::timestamptz - lc.completed_at)) /
              (td.max_interval_days * 86400.0)
            ELSE
              EXTRACT(EPOCH FROM (check_date::timestamptz - td.created_at)) /
              (td.max_interval_days * 86400.0)
          END
        ) >= 0.9
    ) INTO has_red;

    IF has_red OR check_date < CURRENT_DATE - INTERVAL '365 days' THEN
      EXIT;
    END IF;

    streak := streak + 1;
    check_date := check_date - 1;
  END LOOP;

  RETURN streak;
END;
$$;

-- Statistiques du foyer
CREATE OR REPLACE FUNCTION get_household_stats(p_household_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', (
      SELECT COUNT(*) FROM task_definitions WHERE household_id = p_household_id
    ),
    'green_count', (
      SELECT COUNT(*) FROM task_status_view
      WHERE household_id = p_household_id AND status = 'green'
    ),
    'orange_count', (
      SELECT COUNT(*) FROM task_status_view
      WHERE household_id = p_household_id AND status = 'orange'
    ),
    'red_count', (
      SELECT COUNT(*) FROM task_status_view
      WHERE household_id = p_household_id AND status = 'red'
    ),
    'completions_last_30d', (
      SELECT COUNT(*) FROM task_completions tc
      JOIN task_definitions td ON td.id = tc.task_definition_id
      WHERE td.household_id = p_household_id
        AND tc.completed_at >= now() - INTERVAL '30 days'
    ),
    'user_contributions', (
      SELECT json_agg(row_to_json(sub))
      FROM (
        SELECT p.display_name, COUNT(tc.id) AS count
        FROM task_completions tc
        JOIN profiles p ON p.id = tc.user_id
        JOIN task_definitions td ON td.id = tc.task_definition_id
        WHERE td.household_id = p_household_id
          AND tc.completed_at >= now() - INTERVAL '30 days'
        GROUP BY p.display_name
        ORDER BY count DESC
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Profiles : l'utilisateur voit/modifie son profil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Households : visible si membre
CREATE POLICY "Members can view household"
  ON households FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_id = households.id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Anyone can create household"
  ON households FOR INSERT WITH CHECK (true);

-- Memberships
CREATE POLICY "Members can view memberships"
  ON household_memberships FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM household_memberships hm
      WHERE hm.household_id = household_memberships.household_id
        AND hm.user_id = auth.uid()
    )
  );
CREATE POLICY "Members can insert memberships"
  ON household_memberships FOR INSERT WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM household_memberships hm
      WHERE hm.household_id = household_memberships.household_id
        AND hm.user_id = auth.uid()
        AND hm.role = 'admin'
    )
  );

-- Targets : visible si membre du foyer
CREATE POLICY "Members can view targets"
  ON targets FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_id = targets.household_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Members can manage targets"
  ON targets FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_id = targets.household_id AND user_id = auth.uid()
    )
  );

-- Task types : visibles par tous les authentifiés
CREATE POLICY "Authenticated can view task types"
  ON task_types FOR SELECT USING (auth.uid() IS NOT NULL);

-- Task definitions : visible si membre du foyer
CREATE POLICY "Members can view task definitions"
  ON task_definitions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_id = task_definitions.household_id AND user_id = auth.uid()
    )
  );
CREATE POLICY "Members can manage task definitions"
  ON task_definitions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM household_memberships
      WHERE household_id = task_definitions.household_id AND user_id = auth.uid()
    )
  );

-- Task completions : visible si membre du foyer de la tâche
CREATE POLICY "Members can view completions"
  ON task_completions FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM task_definitions td
      JOIN household_memberships hm ON hm.household_id = td.household_id
      WHERE td.id = task_completions.task_definition_id AND hm.user_id = auth.uid()
    )
  );
CREATE POLICY "Members can insert completions"
  ON task_completions FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM task_definitions td
      JOIN household_memberships hm ON hm.household_id = td.household_id
      WHERE td.id = task_completions.task_definition_id AND hm.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own completions"
  ON task_completions FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 6. TRIGGERS
-- ============================================================

-- Auto-créer le profil à l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 7. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE task_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE task_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE targets;
