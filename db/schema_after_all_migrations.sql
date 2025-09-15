--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_admin_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.active_admin_comments (
    id bigint NOT NULL,
    namespace character varying,
    body text,
    resource_type character varying,
    resource_id bigint,
    author_type character varying,
    author_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.active_admin_comments OWNER TO postgres;

--
-- Name: active_admin_comments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.active_admin_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.active_admin_comments_id_seq OWNER TO postgres;

--
-- Name: active_admin_comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.active_admin_comments_id_seq OWNED BY public.active_admin_comments.id;


--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_users (
    id bigint NOT NULL,
    email character varying DEFAULT ''::character varying NOT NULL,
    encrypted_password character varying DEFAULT ''::character varying NOT NULL,
    reset_password_token character varying,
    reset_password_sent_at timestamp without time zone,
    remember_created_at timestamp without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.admin_users OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_users_id_seq OWNER TO postgres;

--
-- Name: admin_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_users_id_seq OWNED BY public.admin_users.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.ar_internal_metadata OWNER TO postgres;

--
-- Name: devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.devices (
    id bigint NOT NULL,
    serial character varying NOT NULL,
    model_id bigint NOT NULL,
    user_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.devices OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.devices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.devices_id_seq OWNER TO postgres;

--
-- Name: devices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.devices_id_seq OWNED BY public.devices.id;


--
-- Name: export_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.export_tokens (
    id bigint NOT NULL,
    description character varying,
    expires_at timestamp(6) without time zone,
    usage_count integer DEFAULT 0 NOT NULL,
    last_used_at timestamp(6) without time zone,
    permissions jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    token_hash character varying NOT NULL,
    revoked_at timestamp(6) without time zone,
    created_by character varying,
    revocation_reason character varying
);


ALTER TABLE public.export_tokens OWNER TO postgres;

--
-- Name: export_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.export_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.export_tokens_id_seq OWNER TO postgres;

--
-- Name: export_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.export_tokens_id_seq OWNED BY public.export_tokens.id;


--
-- Name: extra_measurement_infos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extra_measurement_infos (
    id bigint NOT NULL,
    realtime boolean,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.extra_measurement_infos OWNER TO postgres;

--
-- Name: extra_measurement_infos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extra_measurement_infos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.extra_measurement_infos_id_seq OWNER TO postgres;

--
-- Name: extra_measurement_infos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extra_measurement_infos_id_seq OWNED BY public.extra_measurement_infos.id;


--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.manufacturers (
    id bigint NOT NULL,
    name character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.manufacturers OWNER TO postgres;

--
-- Name: manufacturers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.manufacturers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.manufacturers_id_seq OWNER TO postgres;

--
-- Name: manufacturers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.manufacturers_id_seq OWNED BY public.manufacturers.id;


--
-- Name: measurements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.measurements (
    id bigint NOT NULL,
    device_id bigint NOT NULL,
    co2ppm integer NOT NULL,
    measurementtime timestamp without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    crowding integer,
    sub_location_id bigint,
    extra_measurement_info_id bigint
);


ALTER TABLE public.measurements OWNER TO postgres;

--
-- Name: measurements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.measurements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.measurements_id_seq OWNER TO postgres;

--
-- Name: measurements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.measurements_id_seq OWNED BY public.measurements.id;


--
-- Name: models; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.models (
    id bigint NOT NULL,
    name character varying NOT NULL,
    manufacturer_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.models OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.models_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.models_id_seq OWNER TO postgres;

--
-- Name: models_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.models_id_seq OWNED BY public.models.id;


--
-- Name: places; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.places (
    id bigint NOT NULL,
    google_place_id character varying NOT NULL,
    last_fetched timestamp without time zone NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    place_lat numeric(10,6),
    place_lng numeric(10,6)
);


ALTER TABLE public.places OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.places_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.places_id_seq OWNER TO postgres;

--
-- Name: places_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.places_id_seq OWNED BY public.places.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: sub_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sub_locations (
    id bigint NOT NULL,
    description character varying NOT NULL,
    place_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.sub_locations OWNER TO postgres;

--
-- Name: sub_locations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sub_locations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.sub_locations_id_seq OWNER TO postgres;

--
-- Name: sub_locations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sub_locations_id_seq OWNED BY public.sub_locations.id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_settings (
    id bigint NOT NULL,
    realtime_upload_place_id bigint NOT NULL,
    realtime_upload_sub_location_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL
);


ALTER TABLE public.user_settings OWNER TO postgres;

--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_settings_id_seq OWNER TO postgres;

--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    name character varying,
    sub_google_uid character varying
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: active_admin_comments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_admin_comments ALTER COLUMN id SET DEFAULT nextval('public.active_admin_comments_id_seq'::regclass);


--
-- Name: admin_users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users ALTER COLUMN id SET DEFAULT nextval('public.admin_users_id_seq'::regclass);


--
-- Name: devices id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices ALTER COLUMN id SET DEFAULT nextval('public.devices_id_seq'::regclass);


--
-- Name: export_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_tokens ALTER COLUMN id SET DEFAULT nextval('public.export_tokens_id_seq'::regclass);


--
-- Name: extra_measurement_infos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extra_measurement_infos ALTER COLUMN id SET DEFAULT nextval('public.extra_measurement_infos_id_seq'::regclass);


--
-- Name: manufacturers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manufacturers ALTER COLUMN id SET DEFAULT nextval('public.manufacturers_id_seq'::regclass);


--
-- Name: measurements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements ALTER COLUMN id SET DEFAULT nextval('public.measurements_id_seq'::regclass);


--
-- Name: models id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models ALTER COLUMN id SET DEFAULT nextval('public.models_id_seq'::regclass);


--
-- Name: places id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places ALTER COLUMN id SET DEFAULT nextval('public.places_id_seq'::regclass);


--
-- Name: sub_locations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_locations ALTER COLUMN id SET DEFAULT nextval('public.sub_locations_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: active_admin_comments active_admin_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.active_admin_comments
    ADD CONSTRAINT active_admin_comments_pkey PRIMARY KEY (id);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: devices devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT devices_pkey PRIMARY KEY (id);


--
-- Name: export_tokens export_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.export_tokens
    ADD CONSTRAINT export_tokens_pkey PRIMARY KEY (id);


--
-- Name: extra_measurement_infos extra_measurement_infos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extra_measurement_infos
    ADD CONSTRAINT extra_measurement_infos_pkey PRIMARY KEY (id);


--
-- Name: manufacturers manufacturers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_pkey PRIMARY KEY (id);


--
-- Name: measurements measurements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT measurements_pkey PRIMARY KEY (id);


--
-- Name: models models_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT models_pkey PRIMARY KEY (id);


--
-- Name: places places_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.places
    ADD CONSTRAINT places_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sub_locations sub_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_locations
    ADD CONSTRAINT sub_locations_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: index_active_admin_comments_on_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_active_admin_comments_on_author ON public.active_admin_comments USING btree (author_type, author_id);


--
-- Name: index_active_admin_comments_on_namespace; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_active_admin_comments_on_namespace ON public.active_admin_comments USING btree (namespace);


--
-- Name: index_active_admin_comments_on_resource; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_active_admin_comments_on_resource ON public.active_admin_comments USING btree (resource_type, resource_id);


--
-- Name: index_admin_users_on_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_admin_users_on_email ON public.admin_users USING btree (email);


--
-- Name: index_admin_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_admin_users_on_reset_password_token ON public.admin_users USING btree (reset_password_token);


--
-- Name: index_devices_on_model_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_devices_on_model_id ON public.devices USING btree (model_id);


--
-- Name: index_devices_on_serial; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_devices_on_serial ON public.devices USING btree (serial);


--
-- Name: index_devices_on_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_devices_on_user_id ON public.devices USING btree (user_id);


--
-- Name: index_export_tokens_on_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_export_tokens_on_created_by ON public.export_tokens USING btree (created_by);


--
-- Name: index_export_tokens_on_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_export_tokens_on_expires_at ON public.export_tokens USING btree (expires_at);


--
-- Name: index_export_tokens_on_revoked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_export_tokens_on_revoked_at ON public.export_tokens USING btree (revoked_at);


--
-- Name: index_export_tokens_on_token_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_export_tokens_on_token_hash ON public.export_tokens USING btree (token_hash);


--
-- Name: index_export_tokens_on_token_hash_and_revoked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_export_tokens_on_token_hash_and_revoked_at ON public.export_tokens USING btree (token_hash, revoked_at);


--
-- Name: index_manufacturers_on_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_manufacturers_on_name ON public.manufacturers USING btree (name);


--
-- Name: index_measurements_on_device_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_measurements_on_device_id ON public.measurements USING btree (device_id);


--
-- Name: index_measurements_on_extra_measurement_info_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_measurements_on_extra_measurement_info_id ON public.measurements USING btree (extra_measurement_info_id);


--
-- Name: index_measurements_on_measurementtime; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_measurements_on_measurementtime ON public.measurements USING btree (measurementtime);


--
-- Name: index_measurements_on_sub_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_measurements_on_sub_location_id ON public.measurements USING btree (sub_location_id);


--
-- Name: index_measurements_on_time_and_co2; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_measurements_on_time_and_co2 ON public.measurements USING btree (measurementtime, co2ppm);


--
-- Name: index_models_on_manufacturer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_models_on_manufacturer_id ON public.models USING btree (manufacturer_id);


--
-- Name: index_models_on_name_and_manufacturer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_models_on_name_and_manufacturer_id ON public.models USING btree (name, manufacturer_id);


--
-- Name: index_places_on_google_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_places_on_google_place_id ON public.places USING btree (google_place_id);


--
-- Name: index_places_on_place_lat; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_places_on_place_lat ON public.places USING btree (place_lat);


--
-- Name: index_places_on_place_lng; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_places_on_place_lng ON public.places USING btree (place_lng);


--
-- Name: index_sub_locations_on_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_sub_locations_on_place_id ON public.sub_locations USING btree (place_id);


--
-- Name: index_user_settings_on_realtime_upload_place_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_user_settings_on_realtime_upload_place_id ON public.user_settings USING btree (realtime_upload_place_id);


--
-- Name: index_user_settings_on_realtime_upload_sub_location_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_user_settings_on_realtime_upload_sub_location_id ON public.user_settings USING btree (realtime_upload_sub_location_id);


--
-- Name: index_user_settings_on_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX index_user_settings_on_user_id ON public.user_settings USING btree (user_id);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_sub_google_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX index_users_on_sub_google_uid ON public.users USING btree (sub_google_uid);


--
-- Name: devices fk_rails_0cccef26d6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT fk_rails_0cccef26d6 FOREIGN KEY (model_id) REFERENCES public.models(id);


--
-- Name: measurements fk_rails_29445b3937; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT fk_rails_29445b3937 FOREIGN KEY (sub_location_id) REFERENCES public.sub_locations(id);


--
-- Name: measurements fk_rails_35b855c478; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT fk_rails_35b855c478 FOREIGN KEY (device_id) REFERENCES public.devices(id);


--
-- Name: devices fk_rails_410b63ef65; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.devices
    ADD CONSTRAINT fk_rails_410b63ef65 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_settings fk_rails_5152ae5fff; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT fk_rails_5152ae5fff FOREIGN KEY (realtime_upload_place_id) REFERENCES public.places(id);


--
-- Name: sub_locations fk_rails_c0be3fb349; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sub_locations
    ADD CONSTRAINT fk_rails_c0be3fb349 FOREIGN KEY (place_id) REFERENCES public.places(id);


--
-- Name: measurements fk_rails_c2de35f235; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.measurements
    ADD CONSTRAINT fk_rails_c2de35f235 FOREIGN KEY (extra_measurement_info_id) REFERENCES public.extra_measurement_infos(id);


--
-- Name: user_settings fk_rails_c8cf15598c; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT fk_rails_c8cf15598c FOREIGN KEY (realtime_upload_sub_location_id) REFERENCES public.sub_locations(id);


--
-- Name: user_settings fk_rails_d1371c6356; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT fk_rails_d1371c6356 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: models fk_rails_ed7c54c36f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.models
    ADD CONSTRAINT fk_rails_ed7c54c36f FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id);


--
-- PostgreSQL database dump complete
--

