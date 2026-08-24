import { ClipboardList, BarChart3, DollarSign, BookOpen, GraduationCap, Users, Briefcase, Image, Trophy, Home as HomeIcon, School, FileText, Megaphone, Phone, Notebook } from "lucide-react";

export const ICONS = {
  rollcall: ClipboardList,
  grades: BarChart3,
  fees: DollarSign,
  subjects: BookOpen,
  classteachers: GraduationCap,
  adminstudents: Users,
  staff: Briefcase,
  gallery: Image,
  activities: Trophy,
  dashboard: HomeIcon,
  schoolinfo: School,
    reportcard: FileText,
      noticeboard: Megaphone,
        contactus: Phone,
        mysubjects: Notebook
};

export const MENU_GROUPS = {
  Admin: [
    { group: "Academics", items: [
      { key: "rollcall", label: "Roll Call" },
      { key: "grades", label: "Grades" },
      { key: "subjects", label: "Subjects" },
      { key: "classteachers", label: "Class Teachers" },
            { key: "reportcard", label: "Report Card" },
                  { key: "noticeboard", label: "Notice Board" },
                  { key: "contactus", label: "Contact Us" }
    ]},
    { group: "Accounts", items: [
      { key: "adminstudents", label: "Students & Parents" },
      { key: "fees", label: "Fees" },
    ]},
    { group: "School Life", items: [
      { key: "staff", label: "Staff & Management" },
      { key: "gallery", label: "Gallery" },
      { key: "activities", label: "School Activities" },
    ]},
        { group: "Settings", items: [
      { key: "schoolinfo", label: "School Info" },
    ]},
  ],
  
  Teacher: [
    { group: "Academics", items: [
      { key: "rollcall", label: "Roll Call" },
      { key: "grades", label: "Grades" },
      { key: "subjects", label: "Subjects" },
      { key: "reportcard", label: "Report Card" },
            { key: "noticeboard", label: "Notice Board" },
            { key: "contactus", label: "Contact Us" }
    ]},
    { group: "Accounts", items: [
      { key: "adminstudents", label: "Students & Parents" },
    ]},
    { group: "School Life", items: [
      { key: "staff", label: "Staff & Management" },
      { key: "gallery", label: "Gallery" },
      { key: "activities", label: "School Activities" },
    ]},
  ],
  Student: [
    { group: "My Space", items: [
      { key: "dashboard", label: "My Dashboard" },
            { key: "reportcard", label: "Report Card" },
                  { key: "noticeboard", label: "Notice Board" },
                  { key: "contactus", label: "Contact Us" },
                  { key: "mysubjects", label: "My Subjects" }
    ]},
    { group: "School Life", items: [
      { key: "staff", label: "Staff & Management" },
      { key: "gallery", label: "Gallery" },
      { key: "activities", label: "School Activities" },
    ]},
  ],
  Parent: [
    { group: "My Space", items: [
      { key: "dashboard", label: "My Dashboard" },
            { key: "reportcard", label: "Report Card" },
                  { key: "noticeboard", label: "Notice Board" },
                  { key: "contactus", label: "Contact Us" }
    ]},
    { group: "School Life", items: [
      { key: "staff", label: "Staff & Management" },
      { key: "gallery", label: "Gallery" },
      { key: "activities", label: "School Activities" },
    ]},
  ],
};