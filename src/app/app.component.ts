import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { fromEvent } from 'rxjs';
import { getCookie } from 'src/app/utils/cookie';

@Component({
  selector: 'sga-plan-docente-mf',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  whatLang$ = fromEvent(window, 'lang');
  
  constructor(
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.validateLang();
  }

  validateLang() {
    let lang = getCookie('lang') || 'es';
    this.whatLang$.subscribe((x:any) => {
      lang = x['detail']['answer'];
      this.translate.setDefaultLang(lang);
    })
    this.translate.setDefaultLang(getCookie('lang') || 'es');
  }
}
