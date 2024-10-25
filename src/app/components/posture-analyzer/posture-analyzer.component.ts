import { Component, ElementRef, AfterViewInit, ViewChild, inject, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PostureService } from '../../services/posture.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { DebugComponent } from '../debug/debug.component';
import { MatButtonToggleModule}  from '@angular/material/button-toggle';


@Component({
  selector: 'app-posture-analyzer',
  standalone: true,
  templateUrl: './posture-analyzer.component.html',
  styleUrls: ['./posture-analyzer.component.scss'],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,  
    MatCardModule,     
    MatToolbarModule,
    MatBottomSheetModule,
    DebugComponent,
    MatButtonToggleModule
  ]
})
export class PostureAnalyzerComponent implements AfterViewInit {
  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;
  feedback$: Observable<string>;

  running: boolean = false;
  notifyMe: 'yes'| 'no' = 'no';

  private _bottomSheet = inject(MatBottomSheet);
  

  constructor(private translate: TranslateService, private postureService: PostureService, private renderer: Renderer2) {
    this.feedback$ = this.postureService.feedback$.pipe(
      map((messageCode) => {
        if (!messageCode) {
          return '';
        }
        return this.translate.instant(messageCode);
      })
    );
    this.postureService.goodOrBad$.subscribe(state => {
      this.renderer.removeClass(document.body, 'good');
      this.renderer.removeClass(document.body, 'bad');
      if (state) {
        this.renderer.addClass(document.body, state);
      }
    });
  }

  ngAfterViewInit(): void {
    this.postureService.initializePose();
  }

  start() {
    this.running = true;
    this.postureService.startVideo(this.videoElement);
  }

  stop() {
    this.running = false;
    this.postureService.stopCapture(this.videoElement);
  }

  switchLanguage(language: string) {
    this.translate.use(language);
  }

  openDebug() {
    this._bottomSheet.open(DebugComponent);
  }

}