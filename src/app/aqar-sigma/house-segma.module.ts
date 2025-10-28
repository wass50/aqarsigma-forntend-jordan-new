import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet'; // <-- Add this import
import { WatchlistComponent } from './watchlist/watchlist.component';

@NgModule({
  declarations: [
    
    // ...other components
  ],
  imports: [
    CommonModule,
    FormsModule,
    LeafletModule, // <--
    // ...other modules
  ]
})
export class HouseSegmaModule { }
