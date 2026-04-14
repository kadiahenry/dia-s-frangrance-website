import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from 'src/environments/environment';

interface SeoOptions {
  title: string;
  description: string;
  path?: string;
  robots?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  keywords?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private readonly siteName = "Dia's Fragrances and More";
  private readonly jsonLdId = 'seo-jsonld';
  private readonly defaultImage = environment.defaultOgImage || '/assets/images/logo.png';

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  setPage(options: SeoOptions): void {
    const canonicalUrl = this.toAbsoluteUrl(options.path || '/');
    const fullTitle = options.title.includes(this.siteName)
      ? options.title
      : `${options.title} | ${this.siteName}`;
    const imageUrl = this.toAbsoluteUrl(options.image || this.defaultImage);

    this.title.setTitle(fullTitle);
    this.meta.updateTag({ name: 'description', content: options.description });
    this.meta.updateTag({ name: 'robots', content: options.robots || 'index,follow' });
    this.meta.updateTag({ name: 'keywords', content: options.keywords || 'fragrances, body care, body wash, lotions, perfumes, skincare, Jamaica' });
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: options.description });
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.meta.updateTag({ property: 'og:type', content: options.type || 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: this.siteName });
    this.meta.updateTag({ property: 'og:locale', content: 'en_JM' });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: options.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    this.setCanonical(canonicalUrl);
  }

  setStructuredData(data: Record<string, unknown> | Array<Record<string, unknown>>): void {
    const existing = this.document.getElementById(this.jsonLdId);

    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = this.jsonLdId;
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  clearStructuredData(): void {
    this.document.getElementById(this.jsonLdId)?.remove();
  }

  absoluteUrl(path: string): string {
    return this.toAbsoluteUrl(path);
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  private toAbsoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const configuredBase = environment.siteUrl?.trim().replace(/\/+$/, '');
    const runtimeBase = this.document.location?.origin?.replace(/\/+$/, '') || '';
    const baseUrl = configuredBase || runtimeBase || 'http://localhost:4200';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${normalizedPath}`;
  }
}
