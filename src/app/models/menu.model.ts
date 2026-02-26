// src/app/models/menu.model.ts

export interface ShopInfo {
  name: string;
  tagline: string;
  hours: { daily: string; friday: string };
  contact?: { phone: string };
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: 'food' | 'drink'; 
  image_url: string;
  
  price?: string; 
  
  prices?: { 
    m: string; 
    l?: string | null 
  };
}

export interface MenuData {
  info: ShopInfo;
  menu: MenuItem[]; // The single unified list
  add_ons: any[];
}