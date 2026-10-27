import { Home, ClipboardList, BarChart3, ClipboardCheck, DollarSign, FileText, LayoutGrid, Menu as MenuIcon } from "lucide-react";

export const NAV_ITEMS = {
  Admin: [
    { key: "home", label: "Home", icon: Home },
    { key: "rollcall", label: "Roll Call", icon: ClipboardList },
    { key: "grades", label: "Marks", icon: BarChart3 },
    { key: "fees", label: "Fees", icon: DollarSign },
    { key: "menu", label: "Menu", icon: MenuIcon }
  ],
  Teacher: [
    { key: "home", label: "Home", icon: Home },
    { key: "rollcall", label: "Roll Call", icon: ClipboardList },
    { key: "grades", label: "Marks", icon: BarChart3 },
    { key: "assignments", label: "Tasks", icon: ClipboardCheck },
    { key: "menu", label: "Menu", icon: MenuIcon }
  ],
  Student: [
    { key: "home", label: "Home", icon: Home },
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "assignments", label: "Tasks", icon: ClipboardCheck },
    { key: "reportcard", label: "Results", icon: FileText },
    { key: "menu", label: "Menu", icon: MenuIcon }
  ],
  Parent: [
    { key: "home", label: "Home", icon: Home },
    { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { key: "assignments", label: "Tasks", icon: ClipboardCheck },
    { key: "reportcard", label: "Results", icon: FileText },
    { key: "menu", label: "Menu", icon: MenuIcon }
  ]
};