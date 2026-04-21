export type ISODateString = string;

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  headline?: string;
  summary?: string;
  location?: string;
}

export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: ISODateString;
  endDate?: ISODateString;
  description?: string;
}

export interface Education {
  id: string;
  school: string;
  degree?: string;
  startDate: ISODateString;
  endDate?: ISODateString;
}

export interface Resume {
  profile: Profile;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  updatedAt: ISODateString;
}
