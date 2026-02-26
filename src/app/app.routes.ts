import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
    },
    {
        path: 'menu',
        loadComponent: () => import('./menu/menu.component').then(m => m.MenuComponent)
    }
];
