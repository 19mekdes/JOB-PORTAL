export interface Company {
  id: number | string;
  user_id: string;
  company_name: string;
  company_description: string;
  location: string;
  phone: string;
  industry_id: number;
  cover_image: string;
  is_active: boolean;        
  is_verified: boolean;      
  created_at: Date;
  updated_at: Date;
}


export interface CreateCompanyDTO {
  user_id: string;
  company_name: string;
  company_description: string;
  location: string;
  phone: string;
  industry_id: number;
  cover_image?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

// Company update data (all fields optional)
export interface UpdateCompanyDTO {
  company_name?: string;
  company_description?: string;
  location?: string;
  phone?: string;
  industry_id?: number;
  cover_image?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface CompanyResponse extends Company {
  industry_name?: string;
  jobs_count?: number;
  total_jobs?: number;
}


export interface CompanyWithOwner extends Company {
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface Industry {
  id: number;
  name: string;
  description?: string;
  created_at?: Date;
}


export interface CompanyStats {
  total_companies: number;
  active_companies: number;
  verified_companies: number;
  total_jobs_posted: number;
  companies_by_industry: {
    industry_id: number;
    industry_name: string;
    count: number;
  }[];
}

// Company search filters
export interface CompanyFilters {
  industry_id?: number;
  location?: string;
  is_active?: boolean;
  is_verified?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'company_name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}


export interface CompanySearchResult {
  companies: Company[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}


export interface VerifyCompanyDTO {
  company_id: string;
  is_verified: boolean;
  admin_notes?: string;
}


export interface ActivateCompanyDTO {
  company_id: string;
  is_active: boolean;
  reason?: string;
}


export interface RegisterCompanyDTO {
  company_name: string;
  company_description: string;
  location: string;
  phone: string;
  industry_id: number;
  cover_image?: string;
  website?: string;
  email?: string;
  established_year?: number;
  employee_count?: number;
}

export interface CompanyExtended extends Company {
  website?: string;
  email?: string;
  established_year?: number;
  employee_count?: number;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

// Company documents/attachments
export interface CompanyDocument {
  id: string;
  company_id: string;
  document_type: 'license' | 'certificate' | 'logo' | 'other';
  document_url: string;
  uploaded_at: Date;
  verified: boolean;
}

// Company review interface
export interface CompanyReview {
  id: string;
  company_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: Date;
  updated_at: Date;
}

// Company review with user details
export interface CompanyReviewWithUser extends CompanyReview {
  user_name: string;
  user_avatar?: string;
}

// Company with reviews and rating
export interface CompanyWithRating extends Company {
  average_rating: number;
  total_reviews: number;
  reviews?: CompanyReviewWithUser[];
}

// Company category/industry mapping
export interface IndustryCompanyCount {
  industry_id: number;
  industry_name: string;
  company_count: number;
  active_company_count: number;
}

// Company admin action logs
export interface CompanyActionLog {
  id: string;
  company_id: string;
  action: 'create' | 'update' | 'delete' | 'verify' | 'activate' | 'deactivate';
  performed_by: string;
  performed_at: Date;
  details: string;
  previous_data?: Record<string, any>;
  new_data?: Record<string, any>;
}

// Company validation helpers
export const isCompanyActive = (company: Company): boolean => {
  return company.is_active === true;
};

export const isCompanyVerified = (company: Company): boolean => {
  return company.is_verified === true;
};

export const canCompanyPostJob = (company: Company): boolean => {
  return company.is_active === true && company.is_verified === true;
};

