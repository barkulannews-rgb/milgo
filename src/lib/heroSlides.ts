import { HeroSlide, Language, Product } from '../types';
import { getTranslation } from './translations';

export interface ResolvedHeroSlide {
  id: string;
  image: string;
  headline: string;
  subheadline: string;
  tagLabel: string;
  tagTitle: string;
  product?: Product;
}

// Turn a stored slide into what the storefront shows. Product slides read their image, name and
// description from the live catalog, so edits to the product carry over; returns null when the
// slide cannot be shown (no image, or the product was deleted or deactivated).
export function resolveHeroSlide(slide: HeroSlide, products: Product[], lang: Language): ResolvedHeroSlide | null {
  const so = lang === 'so';
  const customHeadline = so ? slide.headlineSo : slide.headlineEn;
  const customSub = so ? slide.subheadlineSo : slide.subheadlineEn;

  if (slide.source === 'product') {
    const product = products.find((p) => p.id === slide.productId && p.active);
    if (!product || !product.images[0]) return null;
    const name = so ? product.nameSo || product.name : product.name;
    return {
      id: slide.id,
      image: product.images[0],
      headline: customHeadline || name,
      subheadline: customSub || (so ? product.descriptionSo || product.description : product.description),
      tagLabel: slide.tagLabel || product.brand,
      tagTitle: slide.tagTitle || product.name,
      product,
    };
  }

  if (!slide.image) return null;
  return {
    id: slide.id,
    image: slide.image,
    headline: customHeadline || getTranslation(lang, 'heroHeadline'),
    subheadline: customSub || getTranslation(lang, 'heroSubheadline'),
    tagLabel: slide.tagLabel,
    tagTitle: slide.tagTitle,
  };
}
