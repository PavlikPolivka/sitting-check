import { Component } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { PostureAnalyzerComponent } from './components/posture-analyzer/posture-analyzer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PostureAnalyzerComponent, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  constructor(private translate: TranslateService) {
    const browserLang = navigator.language || navigator.languages[0];
    const supportedLanguages = ['en', 'cs'];
    const defaultLang = supportedLanguages.find(lang => browserLang.includes(lang)) || 'en';

    this.translate.setDefaultLang(defaultLang);
  }
}
