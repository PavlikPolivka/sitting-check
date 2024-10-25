import { Component } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { PostureService } from '../../services/posture.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [ MatListModule, CommonModule ],
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.scss'
})
export class DebugComponent {

  debug$: Observable<string>;

  constructor(private postureService: PostureService) {
    this.debug$ = this.postureService.debug$.pipe(
      map((debug) => {
        return JSON.stringify(debug, null, 2);
      })
    );
  }

}
