import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../services/api.service';
import { ApiErrorMessageService } from '../services/api-error-message.service';
import { LegalLinksComponent } from '../shared/legal-links.component';

@Component({
  selector: 'app-customer-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, LegalLinksComponent],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <h1>{{ 'CUSTOMER_AUTH.REGISTER_TITLE' | translate }}</h1>
          <p>{{ 'CUSTOMER_AUTH.REGISTER_SUBTITLE' | translate }}</p>
        </div>

        @if (success()) {
          <div class="success-banner" data-testid="customer-register-success">{{ success() }}</div>
          <div class="auth-actions-foot">
            <a routerLink="/customer/login" data-testid="customer-register-go-login">{{ 'CUSTOMER_AUTH.GO_LOGIN' | translate }}</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" data-testid="customer-register-form">
            <div class="form-group">
              <label for="full_name">{{ 'CUSTOMER_AUTH.FULL_NAME' | translate }}</label>
              <input
                id="full_name"
                type="text"
                formControlName="full_name"
                [placeholder]="'CUSTOMER_AUTH.FULL_NAME_PLACEHOLDER' | translate"
                autocomplete="name"
                data-testid="customer-register-name"
              >
            </div>
            <div class="form-group">
              <label for="email">{{ 'AUTH.EMAIL' | translate }}</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                [placeholder]="'AUTH.EMAIL_PLACEHOLDER' | translate"
                autocomplete="email"
                data-testid="customer-register-email"
              >
            </div>
            <div class="form-group">
              <label for="password">{{ 'AUTH.PASSWORD' | translate }}</label>
              <input
                id="password"
                type="password"
                formControlName="password"
                [placeholder]="'AUTH.PASSWORD_PLACEHOLDER' | translate"
                autocomplete="new-password"
                data-testid="customer-register-password"
              >
            </div>
            @if (error()) {
              <div class="error-banner" data-testid="customer-register-error">{{ error() }}</div>
            }
            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading()" data-testid="customer-register-submit">
              {{ loading() ? ('AUTH.CREATING_ACCOUNT' | translate) : ('AUTH.CREATE_ACCOUNT' | translate) }}
            </button>
          </form>
        }

        <div class="auth-actions-foot">
          <a routerLink="/customer/login">{{ 'CUSTOMER_AUTH.HAVE_ACCOUNT' | translate }}</a>
          <span class="auth-foot-sep" aria-hidden="true">·</span>
          <a routerLink="/login">{{ 'CUSTOMER_AUTH.BACK_STAFF_LOGIN' | translate }}</a>
          @if (legalTermsUrl() || legalPrivacyUrl()) {
            <span class="auth-foot-sep" aria-hidden="true">·</span>
            <app-legal-links [inline]="true" [termsUrl]="legalTermsUrl()" [privacyUrl]="legalPrivacyUrl()" />
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-5);
      background: var(--color-bg);
    }
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--space-8);
    }
    .auth-header { text-align: center; margin-bottom: var(--space-6); }
    .auth-header h1 { font-size: 1.75rem; font-weight: 600; color: var(--color-text); margin-bottom: var(--space-2); }
    .auth-header p { color: var(--color-text-muted); font-size: 0.9375rem; }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; margin-bottom: var(--space-2); font-weight: 500; color: var(--color-text); }
    .form-group input {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: 1rem;
    }
    .error-banner {
      background: rgba(220, 38, 38, 0.1);
      color: var(--color-error);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      margin-bottom: var(--space-4);
    }
    .success-banner {
      background: rgba(22, 163, 74, 0.12);
      color: var(--color-success, #15803d);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      margin-bottom: var(--space-4);
    }
    .btn-submit {
      width: 100%;
      padding: var(--space-4);
      background: var(--color-primary);
      color: var(--color-on-primary);
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .auth-actions-foot {
      margin-top: var(--space-5);
      text-align: center;
      font-size: 0.9375rem;
      color: var(--color-text-muted);
      line-height: 1.6;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: baseline;
      row-gap: var(--space-2);
    }
    .auth-actions-foot > a {
      color: var(--color-primary);
      font-weight: 500;
      text-decoration: none;
    }
    .auth-actions-foot > a:hover { text-decoration: underline; }
    .auth-foot-sep { margin: 0 var(--space-2); user-select: none; }
  `],
})
export class CustomerRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private apiErr = inject(ApiErrorMessageService);
  private translate = inject(TranslateService);

  legalTermsUrl = signal<string | null>(null);
  legalPrivacyUrl = signal<string | null>(null);
  error = signal('');
  success = signal('');
  loading = signal(false);

  form = this.fb.group({
    full_name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.api.getPublicLegalUrls().subscribe({
      next: (u) => {
        this.legalTermsUrl.set(u.terms_of_service_url ?? null);
        this.legalPrivacyUrl.set(u.privacy_policy_url ?? null);
      },
      error: () => {},
    });
  }

  onSubmit(): void {
    if (!this.form.valid) return;
    this.error.set('');
    this.loading.set(true);
    const full_name = this.form.get('full_name')?.value?.trim() || undefined;
    const email = this.form.get('email')?.value ?? '';
    const password = this.form.get('password')?.value ?? '';
    this.api.customerRegister({ email, password, full_name }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(this.translate.instant('CUSTOMER_AUTH.REGISTER_SUCCESS'));
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(this.apiErr.fromHttpError(err, 'AUTH.LOGIN_FAILED'));
      },
    });
  }
}
