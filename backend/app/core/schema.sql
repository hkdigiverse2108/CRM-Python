-- =============================================================================
-- AIO CRM Platform — Unified Lead Management Database Schema (Multi-Tenant)
-- =============================================================================

DROP DATABASE IF EXISTS enterprise_crm;
CREATE DATABASE enterprise_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE enterprise_crm;

-- Set foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- PHASE 1: FOUNDATION TABLES
-- =============================================================================

-- Table: workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id VARCHAR(36) NOT NULL,
    workspace_name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255) NULL,
    subdomain VARCHAR(100) NULL,
    custom_domain VARCHAR(255) NULL,
    logo_url VARCHAR(500) NULL,
    brand_color VARCHAR(50) NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    currency VARCHAR(10) DEFAULT 'USD',
    country VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    language VARCHAR(50) DEFAULT 'en',
    plan_id VARCHAR(50) DEFAULT 'professional',
    plan_status VARCHAR(50) DEFAULT 'active',
    billing_email VARCHAR(255) NULL,
    max_users INT DEFAULT 50,
    max_contacts INT DEFAULT 10000,
    max_storage_gb INT DEFAULT 10,
    trial_days INT DEFAULT 0,
    trial_ends_at TIMESTAMP NULL,
    max_branches INT DEFAULT 1,
    max_leads INT DEFAULT 1000,
    max_pipelines INT DEFAULT 5,
    max_projects INT DEFAULT 10,
    max_automations INT DEFAULT 10,
    max_campaigns INT DEFAULT 10,
    smtp_host VARCHAR(255) NULL,
    smtp_port INT NULL,
    smtp_user VARCHAR(255) NULL,
    smtp_pass VARCHAR(255) NULL,
    branding_enabled TINYINT(1) DEFAULT 0,
    mobile_branding_enabled TINYINT(1) DEFAULT 0,
    is_locked TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (workspace_id),
    UNIQUE KEY idx_workspace_subdomain (subdomain) USING BTREE,
    UNIQUE KEY idx_workspace_custom_domain (custom_domain) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: roles
CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_custom TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id),
    KEY idx_role_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_role_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
    id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    module VARCHAR(100) NOT NULL,
    can_view TINYINT(1) DEFAULT 0,
    can_create TINYINT(1) DEFAULT 0,
    can_edit TINYINT(1) DEFAULT 0,
    can_delete TINYINT(1) DEFAULT 0,
    can_export TINYINT(1) DEFAULT 0,
    can_import TINYINT(1) DEFAULT 0,
    can_approve TINYINT(1) DEFAULT 0,
    can_assign TINYINT(1) DEFAULT 0,
    can_archive TINYINT(1) DEFAULT 0,
    record_scope VARCHAR(50) DEFAULT 'all',
    PRIMARY KEY (id),
    UNIQUE KEY idx_role_module (role_id, module),
    CONSTRAINT fk_rp_role FOREIGN KEY (role_id) 
        REFERENCES roles (role_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NULL,
    record_id VARCHAR(100) NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_audit_workspace (workspace_id) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: departments
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (department_id),
    KEY idx_dept_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_dept_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: branches
CREATE TABLE IF NOT EXISTS branches (
    branch_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (branch_id),
    KEY idx_branch_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_branch_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: saas_audit_logs
CREATE TABLE IF NOT EXISTS saas_audit_logs (
    log_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NULL, -- Can be NULL for system-wide events
    user_id VARCHAR(36) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    status VARCHAR(50) DEFAULT 'active',
    two_factor_enabled TINYINT(1) DEFAULT 0,
    is_locked TINYINT(1) DEFAULT 0,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (user_id),
    UNIQUE KEY idx_user_workspace_email (workspace_id, email) USING BTREE,
    KEY idx_user_role (role_id) USING BTREE,
    CONSTRAINT fk_user_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) 
        REFERENCES roles (role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- PHASE 2: LEAD MANAGEMENT MODULE
-- =============================================================================

-- Table: leads
CREATE TABLE IF NOT EXISTS leads (
    lead_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    assigned_agent_id VARCHAR(36) NULL,
    created_by VARCHAR(36) NULL,
    updated_by VARCHAR(36) NULL,
    
    -- Personal Information
    full_name VARCHAR(255) NOT NULL,
    phone_primary VARCHAR(50) NULL,
    phone_secondary VARCHAR(50) NULL,
    email VARCHAR(255) NULL,
    dob DATE NULL,
    gender VARCHAR(20) NULL,
    avatar_url VARCHAR(500) NULL,
    preferred_language VARCHAR(50) DEFAULT 'en',
    
    -- Business Information
    company_name VARCHAR(255) NULL,
    designation VARCHAR(100) NULL,
    industry VARCHAR(100) NULL,
    company_size VARCHAR(50) NULL,
    gst_number VARCHAR(50) NULL,
    pan_number VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    linkedin_url VARCHAR(255) NULL,
    annual_revenue DECIMAL(15,2) NULL,
    
    -- Address Information
    address1 VARCHAR(255) NULL,
    address2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    pincode VARCHAR(20) NULL,
    country VARCHAR(100) NULL,
    
    -- Lead Information
    lead_source VARCHAR(100) NULL,
    lead_source_detail VARCHAR(255) NULL,
    lead_status VARCHAR(100) NULL,
    lead_score INT DEFAULT 0,
    priority VARCHAR(50) DEFAULT 'medium',
    pipeline_id VARCHAR(36) NULL,
    pipeline_stage_id VARCHAR(36) NULL,
    product_interest VARCHAR(255) NULL,
    deal_value_expected DECIMAL(15,2) NULL,
    followup_at TIMESTAMP NULL,
    last_contacted_at TIMESTAMP NULL,
    next_action VARCHAR(255) NULL,
    win_loss_reason TEXT NULL,
    tags VARCHAR(500) NULL,
    custom_fields JSON NULL,
    
    -- WhatsApp Information
    wa_opt_in TINYINT(1) DEFAULT 0,
    wa_message_id VARCHAR(255) NULL,
    wa_number_id VARCHAR(255) NULL,
    message_type VARCHAR(55) NULL,
    attachment_url VARCHAR(500) NULL,
    first_message TEXT NULL,
    
    -- Meta Ads Information
    meta_ad_id VARCHAR(100) NULL,
    meta_campaign_id VARCHAR(100) NULL,
    meta_form_id VARCHAR(100) NULL,
    campaign_name VARCHAR(255) NULL,
    channel_platform VARCHAR(100) NULL,
    
    -- Website Tracking Information
    utm_source VARCHAR(100) NULL,
    utm_medium VARCHAR(100) NULL,
    utm_campaign VARCHAR(100) NULL,
    utm_term VARCHAR(100) NULL,
    utm_content VARCHAR(100) NULL,
    landing_page_url VARCHAR(500) NULL,
    referrer_url VARCHAR(500) NULL,
    ip_address VARCHAR(50) NULL,
    google_click_id VARCHAR(100) NULL,
    meta_click_id VARCHAR(100) NULL,
    device_type VARCHAR(50) NULL,
    
    -- System Fields
    duplicate_flag TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    
    PRIMARY KEY (lead_id),
    KEY idx_lead_workspace (workspace_id) USING BTREE,
    KEY idx_lead_phone_primary (phone_primary) USING BTREE,
    KEY idx_lead_email (email) USING BTREE,
    KEY idx_lead_company_name (company_name) USING BTREE,
    KEY idx_lead_status (lead_status) USING BTREE,
    KEY idx_lead_assigned_agent (assigned_agent_id) USING BTREE,
    CONSTRAINT fk_lead_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lead_assigned_agent FOREIGN KEY (assigned_agent_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: contacts
CREATE TABLE IF NOT EXISTS contacts (
    contact_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    alt_phone VARCHAR(50) NULL,
    whatsapp VARCHAR(50) NULL,
    company VARCHAR(255) NULL,
    role VARCHAR(100) NULL,
    department VARCHAR(100) NULL,
    website VARCHAR(255) NULL,
    address1 VARCHAR(255) NULL,
    address2 VARCHAR(255) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20) NULL,
    birthday DATE NULL,
    anniversary DATE NULL,
    notes TEXT NULL,
    tags JSON NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (contact_id),
    KEY idx_contact_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: clients
CREATE TABLE IF NOT EXISTS clients (
    client_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NULL,
    business_type VARCHAR(100) NULL,
    gst_number VARCHAR(50) NULL,
    pan_number VARCHAR(50) NULL,
    website VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    alt_phone VARCHAR(50) NULL,
    address TEXT NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20) NULL,
    annual_revenue DECIMAL(15,2) DEFAULT 0.00,
    employees_count INT DEFAULT 0,
    company_size VARCHAR(50) DEFAULT '1-10',
    owner_name VARCHAR(255) NULL,
    account_manager VARCHAR(255) NULL,
    notes TEXT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    projects JSON NULL,
    activities JSON NULL,
    files JSON NULL,
    tasks JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id),
    KEY idx_client_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_sources
CREATE TABLE IF NOT EXISTS lead_sources (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ls_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_ls_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_statuses
CREATE TABLE IF NOT EXISTS lead_statuses (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    status_name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NULL,
    sort_order INT DEFAULT 0,
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lst_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_lst_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_activities
CREATE TABLE IF NOT EXISTS lead_activities (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    activity_title VARCHAR(255) NOT NULL,
    activity_description TEXT NULL,
    activity_by VARCHAR(36) NULL,
    activity_date TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_la_workspace (workspace_id) USING BTREE,
    KEY idx_la_lead (lead_id) USING BTREE,
    CONSTRAINT fk_la_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_la_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_notes
CREATE TABLE IF NOT EXISTS lead_notes (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    note TEXT NOT NULL,
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_ln_workspace (workspace_id) USING BTREE,
    KEY idx_ln_lead (lead_id) USING BTREE,
    CONSTRAINT fk_ln_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ln_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_files
CREATE TABLE IF NOT EXISTS lead_files (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NULL,
    uploaded_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lf_workspace (workspace_id) USING BTREE,
    KEY idx_lf_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lf_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lf_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_tags
CREATE TABLE IF NOT EXISTS lead_tags (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    tag_name VARCHAR(100) NOT NULL,
    tag_color VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lt_workspace (workspace_id) USING BTREE,
    KEY idx_lt_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lt_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lt_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_followups
CREATE TABLE IF NOT EXISTS lead_followups (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    followup_date DATE NOT NULL,
    followup_time TIME NULL,
    followup_type VARCHAR(50) NULL,
    remarks TEXT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lfu_workspace (workspace_id) USING BTREE,
    KEY idx_lfu_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lfu_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lfu_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_assignments
CREATE TABLE IF NOT EXISTS lead_assignments (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    assigned_from VARCHAR(36) NULL,
    assigned_to VARCHAR(36) NOT NULL,
    reason TEXT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_las_workspace (workspace_id) USING BTREE,
    KEY idx_las_lead (lead_id) USING BTREE,
    CONSTRAINT fk_las_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_las_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_messages
CREATE TABLE IF NOT EXISTS lead_messages (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NULL,
    message_body TEXT NULL,
    sender VARCHAR(255) NULL,
    receiver VARCHAR(255) NULL,
    attachment_url VARCHAR(500) NULL,
    delivery_status VARCHAR(50) DEFAULT 'sent',
    message_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lm_workspace (workspace_id) USING BTREE,
    KEY idx_lm_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lm_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lm_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_calls
CREATE TABLE IF NOT EXISTS lead_calls (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    call_type VARCHAR(50) NULL,
    call_duration INT DEFAULT 0,
    call_recording_url VARCHAR(500) NULL,
    call_notes TEXT NULL,
    call_status VARCHAR(50) DEFAULT 'Answered',
    created_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lc_workspace (workspace_id) USING BTREE,
    KEY idx_lc_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lc_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lc_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_emails
CREATE TABLE IF NOT EXISTS lead_emails (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    subject VARCHAR(255) NULL,
    body TEXT NULL,
    sender_email VARCHAR(255) NULL,
    receiver_email VARCHAR(255) NULL,
    status VARCHAR(50) NULL,
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_le_workspace (workspace_id) USING BTREE,
    KEY idx_le_lead (lead_id) USING BTREE,
    CONSTRAINT fk_le_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_le_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_tasks
CREATE TABLE IF NOT EXISTS lead_tasks (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    due_date TIMESTAMP NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    assigned_to VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ltask_workspace (workspace_id) USING BTREE,
    KEY idx_ltask_lead (lead_id) USING BTREE,
    CONSTRAINT fk_ltask_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ltask_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_products
CREATE TABLE IF NOT EXISTS lead_products (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    expected_price DECIMAL(15,2) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lp_workspace (workspace_id) USING BTREE,
    KEY idx_lp_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lp_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lp_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_campaigns
CREATE TABLE IF NOT EXISTS lead_campaigns (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_source VARCHAR(100) NULL,
    campaign_id VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lc_camp_workspace (workspace_id) USING BTREE,
    KEY idx_lc_camp_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lc_camp_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lc_camp_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_custom_fields
CREATE TABLE IF NOT EXISTS lead_custom_fields (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    field_value TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lcf_workspace (workspace_id) USING BTREE,
    KEY idx_lcf_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lcf_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lcf_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_conversions
CREATE TABLE IF NOT EXISTS lead_conversions (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NULL,
    deal_id VARCHAR(36) NULL,
    converted_by VARCHAR(36) NULL,
    conversion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lconv_workspace (workspace_id) USING BTREE,
    KEY idx_lconv_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lconv_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lconv_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_duplicate_logs
CREATE TABLE IF NOT EXISTS lead_duplicate_logs (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    duplicate_with VARCHAR(36) NOT NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ldl_workspace (workspace_id) USING BTREE,
    KEY idx_ldl_lead (lead_id) USING BTREE,
    CONSTRAINT fk_ldl_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ldl_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_score_logs
CREATE TABLE IF NOT EXISTS lead_score_logs (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    old_score INT NOT NULL,
    new_score INT NOT NULL,
    reason TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_lsl_workspace (workspace_id) USING BTREE,
    KEY idx_lsl_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lsl_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lsl_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: lead_audit_logs
CREATE TABLE IF NOT EXISTS lead_audit_logs (
    id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    lead_id VARCHAR(36) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    changed_by VARCHAR(36) NULL,
    changed_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_lal_workspace (workspace_id) USING BTREE,
    KEY idx_lal_lead (lead_id) USING BTREE,
    CONSTRAINT fk_lal_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_lal_lead FOREIGN KEY (lead_id) 
        REFERENCES leads (lead_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PHASE 3: META INTEGRATIONS MODULE
-- =============================================================================

-- Table: meta_integrations
CREATE TABLE IF NOT EXISTS meta_integrations (
    integration_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NULL,
    meta_user_id VARCHAR(255) NOT NULL,
    business_id VARCHAR(255) NULL,
    business_name VARCHAR(255) NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    token_expiry TIMESTAMP NULL,
    scopes TEXT NULL,
    status VARCHAR(50) DEFAULT 'Connected',
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (integration_id),
    KEY idx_meta_int_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_meta_int_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_meta_int_user FOREIGN KEY (user_id) 
        REFERENCES users (user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: facebook_pages
CREATE TABLE IF NOT EXISTS facebook_pages (
    page_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    integration_id VARCHAR(36) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_access_token TEXT NOT NULL,
    category VARCHAR(255) NULL,
    followers_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (page_id),
    KEY idx_fb_page_workspace (workspace_id) USING BTREE,
    KEY idx_fb_page_integration (integration_id) USING BTREE,
    CONSTRAINT fk_fb_page_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fb_page_integration FOREIGN KEY (integration_id) 
        REFERENCES meta_integrations (integration_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: facebook_lead_forms
CREATE TABLE IF NOT EXISTS facebook_lead_forms (
    form_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    page_id VARCHAR(255) NOT NULL,
    form_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (form_id),
    KEY idx_fb_form_workspace (workspace_id) USING BTREE,
    KEY idx_fb_form_page (page_id) USING BTREE,
    CONSTRAINT fk_fb_form_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_fb_form_page FOREIGN KEY (page_id) 
        REFERENCES facebook_pages (page_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: meta_ad_accounts
CREATE TABLE IF NOT EXISTS meta_ad_accounts (
    ad_account_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(255) NULL,
    account_name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(100) DEFAULT 'UTC',
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ad_account_id),
    KEY idx_meta_ad_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_meta_ad_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: instagram_business_accounts
CREATE TABLE IF NOT EXISTS instagram_business_accounts (
    instagram_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    page_id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    followers INT DEFAULT 0,
    profile_picture VARCHAR(500) NULL,
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (instagram_id),
    KEY idx_ig_acc_workspace (workspace_id) USING BTREE,
    KEY idx_ig_acc_page (page_id) USING BTREE,
    CONSTRAINT fk_ig_acc_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ig_acc_page FOREIGN KEY (page_id) 
        REFERENCES facebook_pages (page_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: whatsapp_business_accounts
CREATE TABLE IF NOT EXISTS whatsapp_business_accounts (
    waba_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    business_id VARCHAR(255) NULL,
    account_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (waba_id),
    KEY idx_waba_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_waba_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: whatsapp_phone_numbers
CREATE TABLE IF NOT EXISTS whatsapp_phone_numbers (
    phone_number_id VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    waba_id VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    verified_name VARCHAR(255) NULL,
    phone_number VARCHAR(50) NOT NULL,
    quality_rating VARCHAR(50) DEFAULT 'High',
    status VARCHAR(50) DEFAULT 'Connected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phone_number_id),
    KEY idx_wa_phone_workspace (workspace_id) USING BTREE,
    KEY idx_wa_phone_waba (waba_id) USING BTREE,
    CONSTRAINT fk_wa_phone_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wa_phone_waba FOREIGN KEY (waba_id) 
        REFERENCES whatsapp_business_accounts (waba_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
    project_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    client_id VARCHAR(36) NULL,
    client_name VARCHAR(255) NULL,
    category VARCHAR(100) DEFAULT 'Web Development',
    type VARCHAR(100) DEFAULT 'Client Project',
    priority VARCHAR(50) DEFAULT 'Medium',
    start_date DATE NULL,
    end_date DATE NULL,
    estimated_completion DATE NULL,
    budget DECIMAL(15,2) DEFAULT 0.00,
    project_value DECIMAL(15,2) DEFAULT 0.00,
    department VARCHAR(100) DEFAULT 'Engineering',
    assigned_manager VARCHAR(255) NULL,
    assigned_team JSON NULL,
    status VARCHAR(50) DEFAULT 'Active',
    stage VARCHAR(100) DEFAULT 'New Project',
    tags JSON NULL,
    notes TEXT NULL,
    created_by VARCHAR(255) DEFAULT 'CRM Admin',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (project_id),
    KEY idx_project_workspace (workspace_id) USING BTREE,
    KEY idx_project_client (client_id) USING BTREE,
    CONSTRAINT fk_project_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PHASE 4: E-COMMERCE MODULE
-- =============================================================================

-- Table: ecommerce_products
CREATE TABLE IF NOT EXISTS ecommerce_products (
    product_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    brand VARCHAR(100) DEFAULT 'Generic',
    status VARCHAR(50) DEFAULT 'Active',
    cost_price DECIMAL(15,2) DEFAULT 0.00,
    retail_price DECIMAL(15,2) DEFAULT 0.00,
    tax DECIMAL(5,2) DEFAULT 0.00,
    discount DECIMAL(15,2) DEFAULT 0.00,
    stock_quantity INT DEFAULT 0,
    safety_stock INT DEFAULT 5,
    warehouse VARCHAR(100) DEFAULT 'Chicago',
    platforms JSON NULL,
    description TEXT NULL,
    notes TEXT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (product_id),
    KEY idx_ecom_prod_workspace (workspace_id) USING BTREE,
    KEY idx_ecom_prod_sku (sku) USING BTREE,
    CONSTRAINT fk_ecom_prod_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ecommerce_orders
CREATE TABLE IF NOT EXISTS ecommerce_orders (
    order_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    source VARCHAR(100) NOT NULL,
    customer VARCHAR(255) NOT NULL,
    value DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(100) DEFAULT 'Processing',
    date DATE NULL,
    items VARCHAR(500) NULL,
    tracking VARCHAR(255) NULL,
    courier VARCHAR(255) NULL,
    ship_date DATE NULL,
    expected_delivery DATE NULL,
    delivery_remaining VARCHAR(100) NULL,
    current_location VARCHAR(255) NULL,
    city VARCHAR(255) NULL,
    state VARCHAR(255) NULL,
    country VARCHAR(255) DEFAULT 'India',
    pin_code VARCHAR(20) NULL,
    address TEXT NULL,
    last_update VARCHAR(255) NULL,
    progress INT DEFAULT 0,
    next_hub VARCHAR(255) NULL,
    product_id VARCHAR(36) NULL,
    qty INT DEFAULT 1,
    unit_price DECIMAL(15,2) DEFAULT 0.00,
    discount DECIMAL(15,2) DEFAULT 0.00,
    tax DECIMAL(15,2) DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    notes TEXT NULL,
    timeline JSON NULL,
    events JSON NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (order_id),
    KEY idx_ecom_ord_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_ecom_ord_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ecommerce_inventory
CREATE TABLE IF NOT EXISTS ecommerce_inventory (
    inventory_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    sku VARCHAR(100) NULL,
    stock_quantity INT DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 10,
    location VARCHAR(100) NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (inventory_id),
    KEY idx_ecom_inv_workspace (workspace_id) USING BTREE,
    KEY idx_ecom_inv_product (product_id) USING BTREE,
    CONSTRAINT fk_ecom_inv_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ecom_inv_product FOREIGN KEY (product_id) 
        REFERENCES ecommerce_products (product_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ecommerce_abandoned_carts
CREATE TABLE IF NOT EXISTS ecommerce_abandoned_carts (
    cart_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    price VARCHAR(50) NULL,
    time VARCHAR(100) NULL,
    items_count INT DEFAULT 0,
    items_text VARCHAR(500) NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    recovery_step VARCHAR(100) NULL,
    timeline JSON NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (cart_id),
    KEY idx_ecom_ac_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_ecom_ac_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PHASE 5: FINANCE & BILLING MODULE
-- =============================================================================

-- Table: finance_invoices
CREATE TABLE IF NOT EXISTS finance_invoices (
    invoice_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    client VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    subtotal DECIMAL(15,2) DEFAULT 0.00,
    cgst DECIMAL(15,2) DEFAULT 0.00,
    sgst DECIMAL(15,2) DEFAULT 0.00,
    tax DECIMAL(15,2) DEFAULT 0.00,
    discount DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    notes TEXT NULL,
    items JSON NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (invoice_id),
    KEY idx_fin_inv_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_inv_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: finance_quotes
CREATE TABLE IF NOT EXISTS finance_quotes (
    quote_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    client VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    valid_until DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Sent',
    product_name VARCHAR(255) NOT NULL,
    quantity INT DEFAULT 1,
    price DECIMAL(15,2) DEFAULT 0.00,
    discount DECIMAL(15,2) DEFAULT 0.00,
    tax DECIMAL(15,2) DEFAULT 0.00,
    total DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (quote_id),
    KEY idx_fin_qte_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_qte_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: finance_payments
CREATE TABLE IF NOT EXISTS finance_payments (
    payment_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    invoice_id VARCHAR(36) NOT NULL,
    client VARCHAR(255) NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0.00,
    method VARCHAR(50) NOT NULL,
    reference VARCHAR(255) NULL,
    date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'Completed',
    remarks TEXT NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (payment_id),
    KEY idx_fin_pay_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_pay_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: finance_ledger
CREATE TABLE IF NOT EXISTS finance_ledger (
    transaction_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    debit DECIMAL(15,2) DEFAULT 0.00,
    credit DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (transaction_id),
    KEY idx_fin_ldg_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_ldg_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: finance_expenses
CREATE TABLE IF NOT EXISTS finance_expenses (
    expense_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    payee VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    method VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending Review',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (expense_id),
    KEY idx_fin_exp_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_exp_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: finance_gst_records
CREATE TABLE IF NOT EXISTS finance_gst_records (
    record_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    period VARCHAR(50) NOT NULL,
    collected DECIMAL(15,2) DEFAULT 0.00,
    itc DECIMAL(15,2) DEFAULT 0.00,
    net_due DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft',
    filed_on DATE NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (record_id),
    KEY idx_fin_gst_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_fin_gst_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- PHASE 6: HRMS & PAYROLL MODULE
-- =============================================================================

-- Table: hrms_employees
CREATE TABLE IF NOT EXISTS hrms_employees (
    employee_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    status VARCHAR(50) DEFAULT 'Active',
    gender VARCHAR(20) DEFAULT 'Male',
    dob DATE NULL,
    blood_group VARCHAR(20) DEFAULT 'O+',
    marital_status VARCHAR(50) DEFAULT 'Single',
    emergency_contact VARCHAR(50) NULL,
    current_address TEXT NULL,
    permanent_address TEXT NULL,
    aadhaar_number VARCHAR(50) NULL,
    pan_number VARCHAR(50) NULL,
    bank_name VARCHAR(100) DEFAULT 'HDFC Bank',
    account_number VARCHAR(100) NULL,
    ifsc_code VARCHAR(50) NULL,
    uan_number VARCHAR(50) NULL,
    pf_number VARCHAR(50) NULL,
    reporting_manager VARCHAR(100) NULL,
    employment_type VARCHAR(50) DEFAULT 'Full-Time',
    join_date DATE NULL,
    shift_assignment VARCHAR(100) DEFAULT 'General Shift',
    work_location VARCHAR(100) DEFAULT 'Bangalore Office',
    attendance_status VARCHAR(50) DEFAULT 'Present',
    salary_structure JSON NULL,
    assets JSON NULL,
    documents JSON NULL,
    history JSON NULL,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (employee_id),
    KEY idx_hrms_emp_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_hrms_emp_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: hrms_attendance
CREATE TABLE IF NOT EXISTS hrms_attendance (
    attendance_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    check_in VARCHAR(50) NULL,
    check_out VARCHAR(50) NULL,
    working_hours DECIMAL(5,2) DEFAULT 0.00,
    break_duration VARCHAR(50) NULL,
    overtime_hours DECIMAL(5,2) DEFAULT 0.00,
    method VARCHAR(100) DEFAULT 'Manual Entry',
    status VARCHAR(50) DEFAULT 'Present',
    active TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (attendance_id),
    KEY idx_hrms_att_workspace (workspace_id) USING BTREE,
    KEY idx_hrms_att_employee (employee_id) USING BTREE,
    CONSTRAINT fk_hrms_att_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hrms_att_employee FOREIGN KEY (employee_id) 
        REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: hrms_leaves
CREATE TABLE IF NOT EXISTS hrms_leaves (
    leave_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days INT NOT NULL,
    reason TEXT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (leave_id),
    KEY idx_hrms_lvs_workspace (workspace_id) USING BTREE,
    KEY idx_hrms_lvs_employee (employee_id) USING BTREE,
    CONSTRAINT fk_hrms_lvs_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hrms_lvs_employee FOREIGN KEY (employee_id) 
        REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: hrms_payroll
CREATE TABLE IF NOT EXISTS hrms_payroll (
    payroll_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    employee_name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    month VARCHAR(50) NOT NULL,
    basic DECIMAL(15,2) DEFAULT 0.00,
    hra DECIMAL(15,2) DEFAULT 0.00,
    allowances DECIMAL(15,2) DEFAULT 0.00,
    incentives DECIMAL(15,2) DEFAULT 0.00,
    bonus DECIMAL(15,2) DEFAULT 0.00,
    pf DECIMAL(15,2) DEFAULT 0.00,
    esi DECIMAL(15,2) DEFAULT 0.00,
    tds DECIMAL(15,2) DEFAULT 0.00,
    loan_deductions DECIMAL(15,2) DEFAULT 0.00,
    gross_pay DECIMAL(15,2) DEFAULT 0.00,
    total_deductions DECIMAL(15,2) DEFAULT 0.00,
    net_pay DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (payroll_id),
    KEY idx_hrms_prl_workspace (workspace_id) USING BTREE,
    KEY idx_hrms_prl_employee (employee_id) USING BTREE,
    CONSTRAINT fk_hrms_prl_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_hrms_prl_employee FOREIGN KEY (employee_id) 
        REFERENCES hrms_employees (employee_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: tasks
CREATE TABLE IF NOT EXISTS tasks (
    task_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) DEFAULT 'Task',
    priority VARCHAR(50) DEFAULT 'Medium',
    status VARCHAR(50) DEFAULT 'To Do',
    assignee VARCHAR(255) DEFAULT 'Arjun Mehta',
    start_date DATE NULL,
    due_date DATE NULL,
    reminder_date DATE NULL,
    description TEXT NULL,
    notes TEXT NULL,
    project VARCHAR(255) DEFAULT 'General',
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (task_id),
    KEY idx_task_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_task_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: reminders
CREATE TABLE IF NOT EXISTS reminders (
    reminder_id VARCHAR(36) NOT NULL,
    workspace_id VARCHAR(36) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(100) DEFAULT 'Call',
    time VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'Medium',
    linked_to VARCHAR(255) DEFAULT 'Vikram Patel',
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
    updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at TIMESTAMP(6) NULL,
    PRIMARY KEY (reminder_id),
    KEY idx_reminder_workspace (workspace_id) USING BTREE,
    CONSTRAINT fk_reminder_workspace FOREIGN KEY (workspace_id) 
        REFERENCES workspaces (workspace_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: shopify_connections
CREATE TABLE IF NOT EXISTS shopify_connections (
    tenant_id VARCHAR(36) NOT NULL,
    shop_domain VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    scopes TEXT NULL,
    refresh_token TEXT NULL,
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id),
    UNIQUE KEY idx_shopify_shop (shop_domain) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

