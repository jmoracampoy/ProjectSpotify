import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule),
  },
  {
    path: 'song-detail/:id',
    loadChildren: () => import('./song-detail/song-detail.module').then( m => m.SongDetailPageModule)
  },
  {
    path: 'add-song',
    loadChildren: () => import('./add-song/add-song.module').then( m => m.AddSongPageModule)
  },
  {
    path: 'edit-song/:id',
    loadChildren: () => import('./edit-song/edit-song.module').then( m => m.EditSongPageModule)
  },


];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
