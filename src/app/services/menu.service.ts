import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { MenuData, MenuItem, ShopInfo } from '../models/menu.model';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private dataUrl = 'data/menu.json'; 
  private http = inject(HttpClient);

  // 1. Get the Raw Full Data (Info + Menu + Add-ons)
  getMenuData(): Observable<MenuData> {
    return this.http.get<MenuData>(this.dataUrl);
  }

  // 2. Get Just the Menu List (Food & Drinks together)
  // This is what your Component's "menuItems" signal will use.
  getAllItems(): Observable<MenuItem[]> {
    return this.getMenuData().pipe(
      map((data) => data.menu)
    );
  }

  // 3. Get Shop Info (For your header/footer)
  getShopInfo(): Observable<ShopInfo> {
    return this.getMenuData().pipe(
      map((data) => data.info)
    );
  }

  // Optional: If you still need specific filtering in other components
  getItemsByCategory(categoryName: string): Observable<MenuItem[]> {
    return this.getAllItems().pipe(
      map((items) => items.filter((item) => item.category === categoryName))
    );
  }
}
