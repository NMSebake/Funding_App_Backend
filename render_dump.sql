--
-- PostgreSQL database dump
--

\restrict t12wAk883YaTER1gnP7x6HTNIR3a7AQ8xJgoC19VMeh87qL4qajL3aGuzpLUmJX

-- Dumped from database version 18.0 (Debian 18.0-1.pgdg12+3)
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: funding_app_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO funding_app_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: funding_app_user
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone_number text NOT NULL,
    company_name text NOT NULL,
    company_reg_number text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clients OWNER TO funding_app_user;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: funding_app_user
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO funding_app_user;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: funding_app_user
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: funding_requests; Type: TABLE; Schema: public; Owner: funding_app_user
--

CREATE TABLE public.funding_requests (
    id integer NOT NULL,
    client_id integer,
    funding_type text NOT NULL,
    purchase_order_value numeric(15,2) NOT NULL,
    funding_amount numeric(15,2) NOT NULL,
    end_user_department text NOT NULL,
    tax_certificate_path text,
    bank_statement_path text,
    id_copy_path text,
    csd_report_path text,
    company_registration_path text,
    supplier_quotation_path text,
    purchase_order_invoice_path text,
    status text DEFAULT 'pending'::text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.funding_requests OWNER TO funding_app_user;

--
-- Name: funding_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: funding_app_user
--

CREATE SEQUENCE public.funding_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.funding_requests_id_seq OWNER TO funding_app_user;

--
-- Name: funding_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: funding_app_user
--

ALTER SEQUENCE public.funding_requests_id_seq OWNED BY public.funding_requests.id;


--
-- Name: individual_investor_reg; Type: TABLE; Schema: public; Owner: funding_app_user
--

CREATE TABLE public.individual_investor_reg (
    investor_id integer NOT NULL,
    full_name text NOT NULL,
    id_or_passport_number text NOT NULL,
    email_address text NOT NULL,
    phone_number text NOT NULL,
    residential_address text NOT NULL,
    tax_and_compliance text,
    sars_income_tax_number text,
    politically_exposed_person boolean DEFAULT false,
    source_of_funds text,
    risk_tolerance text,
    password_hash text NOT NULL,
    id_passport_copy_url text,
    proof_of_residence_url text,
    bank_statement_url text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.individual_investor_reg OWNER TO funding_app_user;

--
-- Name: individual_investor_reg_investor_id_seq; Type: SEQUENCE; Schema: public; Owner: funding_app_user
--

CREATE SEQUENCE public.individual_investor_reg_investor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.individual_investor_reg_investor_id_seq OWNER TO funding_app_user;

--
-- Name: individual_investor_reg_investor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: funding_app_user
--

ALTER SEQUENCE public.individual_investor_reg_investor_id_seq OWNED BY public.individual_investor_reg.investor_id;


--
-- Name: institutional_investor_reg; Type: TABLE; Schema: public; Owner: funding_app_user
--

CREATE TABLE public.institutional_investor_reg (
    id integer NOT NULL,
    registered_name text NOT NULL,
    vat_number text,
    income_tax_ref_number text,
    physical_address text NOT NULL,
    authorized_signatory_details text,
    signatory_full_name text,
    id_passport_number text,
    contact_number text,
    email_address text NOT NULL,
    password_hash text NOT NULL,
    certificate_of_incorporation text,
    memorandum_of_incorporation text,
    fsca_license text,
    board_resolution text,
    company_bank_statement text,
    sars_tax_clearance_certificate text,
    proof_of_business_address text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.institutional_investor_reg OWNER TO funding_app_user;

--
-- Name: institutional_investor_reg_id_seq; Type: SEQUENCE; Schema: public; Owner: funding_app_user
--

CREATE SEQUENCE public.institutional_investor_reg_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.institutional_investor_reg_id_seq OWNER TO funding_app_user;

--
-- Name: institutional_investor_reg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: funding_app_user
--

ALTER SEQUENCE public.institutional_investor_reg_id_seq OWNED BY public.institutional_investor_reg.id;


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: funding_requests id; Type: DEFAULT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.funding_requests ALTER COLUMN id SET DEFAULT nextval('public.funding_requests_id_seq'::regclass);


--
-- Name: individual_investor_reg investor_id; Type: DEFAULT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.individual_investor_reg ALTER COLUMN investor_id SET DEFAULT nextval('public.individual_investor_reg_investor_id_seq'::regclass);


--
-- Name: institutional_investor_reg id; Type: DEFAULT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.institutional_investor_reg ALTER COLUMN id SET DEFAULT nextval('public.institutional_investor_reg_id_seq'::regclass);


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: funding_app_user
--

COPY public.clients (id, full_name, email, phone_number, company_name, company_reg_number, password_hash, created_at) FROM stdin;
4	Nkgopoleng Matsimela Sebake	sebaketsime@gmail.com	0603441970	Matsimela Solutions	2017/123456/07	$2a$10$7.sVIGpZ/PkTVqt620aJK.l.n0jnGRIpTnHrXD0fwlIrRhuN146ay	2025-11-22 18:50:53.655477
\.


--
-- Data for Name: funding_requests; Type: TABLE DATA; Schema: public; Owner: funding_app_user
--

COPY public.funding_requests (id, client_id, funding_type, purchase_order_value, funding_amount, end_user_department, tax_certificate_path, bank_statement_path, id_copy_path, csd_report_path, company_registration_path, supplier_quotation_path, purchase_order_invoice_path, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: individual_investor_reg; Type: TABLE DATA; Schema: public; Owner: funding_app_user
--

COPY public.individual_investor_reg (investor_id, full_name, id_or_passport_number, email_address, phone_number, residential_address, tax_and_compliance, sars_income_tax_number, politically_exposed_person, source_of_funds, risk_tolerance, password_hash, id_passport_copy_url, proof_of_residence_url, bank_statement_url, created_at) FROM stdin;
\.


--
-- Data for Name: institutional_investor_reg; Type: TABLE DATA; Schema: public; Owner: funding_app_user
--

COPY public.institutional_investor_reg (id, registered_name, vat_number, income_tax_ref_number, physical_address, authorized_signatory_details, signatory_full_name, id_passport_number, contact_number, email_address, password_hash, certificate_of_incorporation, memorandum_of_incorporation, fsca_license, board_resolution, company_bank_statement, sars_tax_clearance_certificate, proof_of_business_address, created_at) FROM stdin;
\.


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: funding_app_user
--

SELECT pg_catalog.setval('public.clients_id_seq', 4, true);


--
-- Name: funding_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: funding_app_user
--

SELECT pg_catalog.setval('public.funding_requests_id_seq', 1, false);


--
-- Name: individual_investor_reg_investor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: funding_app_user
--

SELECT pg_catalog.setval('public.individual_investor_reg_investor_id_seq', 1, false);


--
-- Name: institutional_investor_reg_id_seq; Type: SEQUENCE SET; Schema: public; Owner: funding_app_user
--

SELECT pg_catalog.setval('public.institutional_investor_reg_id_seq', 1, false);


--
-- Name: clients clients_email_key; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_email_key UNIQUE (email);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: funding_requests funding_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.funding_requests
    ADD CONSTRAINT funding_requests_pkey PRIMARY KEY (id);


--
-- Name: individual_investor_reg individual_investor_reg_email_address_key; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.individual_investor_reg
    ADD CONSTRAINT individual_investor_reg_email_address_key UNIQUE (email_address);


--
-- Name: individual_investor_reg individual_investor_reg_id_or_passport_number_key; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.individual_investor_reg
    ADD CONSTRAINT individual_investor_reg_id_or_passport_number_key UNIQUE (id_or_passport_number);


--
-- Name: individual_investor_reg individual_investor_reg_pkey; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.individual_investor_reg
    ADD CONSTRAINT individual_investor_reg_pkey PRIMARY KEY (investor_id);


--
-- Name: institutional_investor_reg institutional_investor_reg_email_address_key; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.institutional_investor_reg
    ADD CONSTRAINT institutional_investor_reg_email_address_key UNIQUE (email_address);


--
-- Name: institutional_investor_reg institutional_investor_reg_pkey; Type: CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.institutional_investor_reg
    ADD CONSTRAINT institutional_investor_reg_pkey PRIMARY KEY (id);


--
-- Name: funding_requests funding_requests_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: funding_app_user
--

ALTER TABLE ONLY public.funding_requests
    ADD CONSTRAINT funding_requests_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO funding_app_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO funding_app_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO funding_app_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO funding_app_user;


--
-- PostgreSQL database dump complete
--

\unrestrict t12wAk883YaTER1gnP7x6HTNIR3a7AQ8xJgoC19VMeh87qL4qajL3aGuzpLUmJX

