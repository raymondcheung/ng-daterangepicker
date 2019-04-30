import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DaterangePickerComponent } from './daterange-picker.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [
    DaterangePickerComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    
  ],
  exports: [
    DaterangePickerComponent
  ]
})
export class DaterangePickerModule { }
