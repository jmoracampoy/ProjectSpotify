import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SongDetailPageRoutingModule } from './song-detail-routing.module';

import { SongDetailPage } from './song-detail.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SongDetailPageRoutingModule,
    ReactiveFormsModule
  ],
  declarations: [SongDetailPage]
})
export class SongDetailPageModule {}
