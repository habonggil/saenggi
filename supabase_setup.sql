-- ============================================
-- 생기출판사 예약 시스템 Supabase 테이블 생성 SQL
-- Supabase > SQL Editor 에서 실행
-- ============================================

-- 1. orders 테이블
CREATE TABLE IF NOT EXISTS orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      timestamptz DEFAULT now(),
  status          text DEFAULT 'pending',  -- pending / paid / shipped / cancelled
  name            text NOT NULL,
  phone           text NOT NULL,
  email           text NOT NULL,
  kakao_id        text,
  address         text,
  address_detail  text,
  zipcode         text,
  birth_date      date,
  birth_time      text,
  gender          text,
  city            text,
  payment_key     text,
  order_id        text UNIQUE,
  amount          integer DEFAULT 50000,
  tracking_number text,
  reading_done    boolean DEFAULT false,
  reading_sent_at timestamptz,
  sns_verified    boolean DEFAULT false,
  sns_image_url   text,
  bookstore_verified boolean DEFAULT false,
  bookstore_image_url text
);

-- 2. cities 테이블
CREATE TABLE IF NOT EXISTS cities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name     text UNIQUE NOT NULL,
  capacity      integer DEFAULT 30,
  current_count integer DEFAULT 0,
  confirmed     boolean DEFAULT false,
  confirmed_at  timestamptz
);

-- 기본 도시 데이터 삽입
INSERT INTO cities (city_name) VALUES
  ('서울'), ('부산'), ('대구'), ('인천'), ('광주'),
  ('대전'), ('울산'), ('수원'), ('청주'), ('전주')
ON CONFLICT (city_name) DO NOTHING;

-- 3. notifications 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  uuid REFERENCES orders(id) ON DELETE CASCADE,
  type      text,   -- payment / reading / shipping / concert
  channel   text,   -- sms / email
  sent_at   timestamptz DEFAULT now(),
  success   boolean DEFAULT true,
  message   text
);

-- ============================================
-- RLS (Row Level Security) 정책
-- ============================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- orders: 일반 사용자는 INSERT만 가능
CREATE POLICY "orders_insert" ON orders
  FOR INSERT TO anon WITH CHECK (true);

-- cities: 모든 사용자 SELECT 가능 (잔여석 확인)
CREATE POLICY "cities_select" ON cities
  FOR SELECT TO anon USING (true);

-- ============================================
-- orders count → cities 자동 업데이트 트리거
-- ============================================

CREATE OR REPLACE FUNCTION update_city_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    UPDATE cities SET current_count = current_count + 1
    WHERE city_name = NEW.city;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_city_count
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_city_count();

-- ============================================
-- increment_city_count RPC (Edge Function에서 호출용)
-- ============================================

CREATE OR REPLACE FUNCTION increment_city_count(city_name text)
RETURNS void AS $$
BEGIN
  UPDATE cities SET current_count = current_count + 1
  WHERE cities.city_name = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Supabase Storage 버킷 생성 (Storage 탭에서도 가능)
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('verifications', 'verifications', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 인증된 요청만 업로드 가능
CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'verifications');
