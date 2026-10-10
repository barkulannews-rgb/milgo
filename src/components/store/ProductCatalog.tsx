import React, { useState, useMemo } from 'react';
import { Filter, SlidersHorizontal, Grid, List, Search, RotateCcw } from 'lucide-react';
import { Product, ProductVariant, FragranceFamily, GenderCategory, Language } from '../../types';
import { ProductCard } from './ProductCard';
import { getTranslation } from '../../lib/translations';

interface ProductCatalogProps {
  products: Product[];
  lang: Language;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  initialGenderFilter?: string;
  initialCategoryFilter?: string;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  lang,
  onQuickView,
  onAddToCart,
  wishlist,
  onToggleWishlist,
  initialGenderFilter,
  initialCategoryFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>(initialGenderFilter || 'All');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [selectedSize, setSelectedSize] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Extract unique brands
  const brands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand)));
  }, [products]);

  // Extract unique families
  const families: FragranceFamily[] = ['Oriental', 'Woody', 'Floral', 'Citrus'];

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = p.name.toLowerCase().includes(query) || (p.nameSo && p.nameSo.toLowerCase().includes(query));
        const brandMatch = p.brand.toLowerCase().includes(query);
        const familyMatch = p.fragranceFamily.toLowerCase().includes(query);
        const noteMatch = [
          ...p.notes.top,
          ...p.notes.heart,
          ...p.notes.base,
        ].some((n) => n.toLowerCase().includes(query));

        if (!nameMatch && !brandMatch && !familyMatch && !noteMatch) return false;
      }

      // Gender
      if (selectedGender !== 'All' && p.gender !== selectedGender) return false;

      // Family
      if (selectedFamily !== 'All' && p.fragranceFamily !== selectedFamily) return false;

      // Brand
      if (selectedBrand !== 'All' && p.brand !== selectedBrand) return false;

      // Size
      if (selectedSize !== 'All') {
        const hasSize = p.variants.some((v) => v.size === selectedSize);
        if (!hasSize) return false;
      }

      // In Stock
      if (inStockOnly) {
        const hasStock = p.variants.some((v) => v.stockQuantity > 0);
        if (!hasStock) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedGender, selectedFamily, selectedBrand, selectedSize, inStockOnly]);

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      const getMinPrice = (prod: Product) => {
        return Math.min(...prod.variants.map((v) => v.discountPrice || v.sellingPrice));
      };

      if (sortBy === 'price-asc') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortBy === 'price-desc') {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 'featured'
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });
  }, [filteredProducts, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGender('All');
    setSelectedFamily('All');
    setSelectedBrand('All');
    setSelectedSize('All');
    setInStockOnly(false);
    setSortBy('featured');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedGender !== 'All' ||
    selectedFamily !== 'All' ||
    selectedBrand !== 'All' ||
    selectedSize !== 'All' ||
    inStockOnly;

  return (
    <section id="catalog-section" className="py-20 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-line">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl text-fg">{getTranslation(lang, 'allFragrances')}</h2>
            <p className="text-sm text-fg-3 mt-1">
              {sortedProducts.length} {lang === 'so' ? 'cadar' : 'fragrances'}
            </p>
          </div>

          {/* Search bar inside catalog */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={getTranslation(lang, 'searchPlaceholder')}
                className="w-full bg-surface border border-line-strong focus:border-gold rounded pl-10 pr-4 py-2 text-xs text-fg placeholder-fg-3 outline-none transition-colors shadow-2xs"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-surface border border-line-strong rounded shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-surface-3 text-gold' : 'text-fg-3 hover:text-fg'
                }`}
                aria-label="Grid view"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewMode === 'list' ? 'bg-surface-3 text-gold' : 'text-fg-3 hover:text-fg'
                }`}
                aria-label="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-10 pb-5 border-b border-line">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Gender Audience Tabs */}
            <div className="flex items-center gap-1.5">
              {['All', 'Men', 'Women', 'Unisex'].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`px-3.5 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                    selectedGender === g ? 'bg-inverse text-on-inverse' : 'text-fg-2 hover:text-fg'
                  }`}
                >
                  {getTranslation(lang, g === 'All' ? 'all' : g === 'Men' ? 'men' : g === 'Women' ? 'women' : 'unisex')}
                </button>
              ))}
            </div>

            {/* In Stock toggle */}
            <label className="flex items-center gap-2 text-xs text-fg-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-line-strong text-gold focus:ring-0 bg-surface-3 accent-gold"
              />
              <span className="font-medium">{getTranslation(lang, 'inStockOnly')}</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-line">
            {/* Olfactory Family Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-fg-3">{getTranslation(lang, 'fragranceFamily')}</span>
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="bg-surface-2 border border-line-strong text-xs text-fg rounded px-2.5 py-1.5 outline-none focus:border-gold"
              >
                <option value="All">{getTranslation(lang, 'all')}</option>
                {families.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-fg-3">{getTranslation(lang, 'brand')}</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="bg-surface-2 border border-line-strong text-xs text-fg rounded px-2.5 py-1.5 outline-none focus:border-gold"
              >
                <option value="All">{getTranslation(lang, 'all')}</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Bottle Size Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.12em] text-fg-3">{getTranslation(lang, 'bottleSize')}</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="bg-surface-2 border border-line-strong text-xs text-fg rounded px-2.5 py-1.5 outline-none focus:border-gold"
              >
                <option value="All">{getTranslation(lang, 'all')}</option>
                <option value="50ml">50ml</option>
                <option value="70ml">70ml</option>
                <option value="100ml">100ml</option>
              </select>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[11px] uppercase tracking-[0.12em] text-fg-3">{getTranslation(lang, 'sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-surface-2 border border-line-strong text-xs text-fg rounded px-2.5 py-1.5 outline-none focus:border-gold"
              >
                <option value="featured">{getTranslation(lang, 'sortFeatured')}</option>
                <option value="price-asc">{getTranslation(lang, 'sortPriceAsc')}</option>
                <option value="price-desc">{getTranslation(lang, 'sortPriceDesc')}</option>
                <option value="newest">{getTranslation(lang, 'sortNewest')}</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] uppercase tracking-[0.12em] text-fg-3 hover:text-fg underline underline-offset-4 transition-colors cursor-pointer"
              >
                <span>{lang === 'so' ? 'Nadiifi' : 'Clear'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid / List */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-20 px-4 bg-surface border border-line rounded-xl">
            <p className="text-base text-fg-2 mb-4">
              {lang === 'so' ? 'Wax lama helin.' : 'No matches.'}
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 bg-inverse text-on-inverse text-xs font-semibold uppercase tracking-wider rounded cursor-pointer"
            >
              {lang === 'so' ? 'Nadiifi' : 'Clear filters'}
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10'
                : 'flex flex-col gap-4'
            }
          >
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                lang={lang}
                onQuickView={onQuickView}
                onAddToCart={onAddToCart}
                isWishlisted={wishlist.includes(product.id)}
                onToggleWishlist={onToggleWishlist}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
