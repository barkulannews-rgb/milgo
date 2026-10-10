import React, { useState } from 'react';
import { Heart, Check, Star } from 'lucide-react';
import { Product, ProductVariant, Language } from '../../types';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface ProductCardProps {
  product: Product;
  lang: Language;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, variant: ProductVariant) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  lang,
  onQuickView,
  onAddToCart,
  isWishlisted,
  onToggleWishlist,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0] || {
      id: 'default',
      size: '50ml',
      sku: 'SKU',
      costPrice: 0,
      sellingPrice: 100,
      stockQuantity: 0,
      lowStockThreshold: 2,
    }
  );

  const [addedAnimation, setAddedAnimation] = useState(false);

  const isOutOfStock = selectedVariant.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold;

  const currentPrice = selectedVariant.discountPrice || selectedVariant.sellingPrice;
  const originalPrice = selectedVariant.discountPrice ? selectedVariant.sellingPrice : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product, selectedVariant);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const displayName = lang === 'so' && product.nameSo ? product.nameSo : product.name;

  return (
    <div onClick={() => onQuickView(product)} className="group flex flex-col cursor-pointer">
      <div className="relative aspect-[4/5] bg-surface-3 overflow-hidden">
        <img
          src={product.images[0] || '/images/hero_luxury_perfume_1791620587322.jpg'}
          alt={displayName}
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          referrerPolicy="no-referrer"
        />

        {(product.isNewArrival || product.bestSeller || isOutOfStock) && (
          <span className="absolute top-3 left-3 text-[10px] tracking-[0.14em] uppercase text-fg bg-surface/90 px-2 py-1">
            {isOutOfStock
              ? getTranslation(lang, 'outOfStock')
              : product.isNewArrival
              ? getTranslation(lang, 'newArrivals')
              : getTranslation(lang, 'bestsellers')}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className="absolute top-2 right-2 p-2 text-[#14110d] hover:opacity-70 transition-opacity cursor-pointer"
          aria-label={getTranslation(lang, 'wishlist')}
        >
          <Heart className={`w-[18px] h-[18px] ${isWishlisted ? 'fill-current text-red-600' : ''}`} strokeWidth={1.5} />
        </button>

        {!isOutOfStock && (
          <button
            onClick={handleAdd}
            className={`absolute bottom-0 inset-x-0 py-3 text-xs uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer sm:translate-y-full sm:group-hover:translate-y-0 ${
              addedAnimation ? 'bg-[#15803d] text-white translate-y-0' : 'bg-inverse/95 hover:bg-inverse text-on-inverse'
            }`}
          >
            {addedAnimation ? (
              <span className="inline-flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                {lang === 'so' ? 'Waa la daray' : 'Added'}
              </span>
            ) : (
              getTranslation(lang, 'addToCart')
            )}
          </button>
        )}
      </div>

      <div className="pt-4 flex flex-col gap-1">
        <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3">{product.brand}</span>
        <h3 className="font-serif text-lg text-fg leading-snug line-clamp-1">{displayName}</h3>
        {product.reviewCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-fg-3">
            <Star className="w-3 h-3 fill-current text-gold" strokeWidth={0} />
            {product.rating.toFixed(1)} ({product.reviewCount})
          </span>
        )}

        <div className="flex items-center justify-between gap-2 mt-1">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-[15px] text-fg">{formatMoney(currentPrice)}</span>
            {originalPrice && <span className="text-xs text-fg-4 line-through">{formatMoney(originalPrice)}</span>}
          </div>
          {product.variants.length > 1 ? (
            <div className="flex items-center gap-1">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(v);
                  }}
                  className={`px-1.5 py-0.5 text-[11px] transition-colors cursor-pointer ${
                    selectedVariant.id === v.id ? 'text-fg underline underline-offset-4' : 'text-fg-3 hover:text-fg'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-fg-3">{selectedVariant.size}</span>
          )}
        </div>
        {isLowStock && !isOutOfStock && <span className="text-[11px] text-amber-600">{getTranslation(lang, 'lowStock')}</span>}
      </div>
    </div>
  );
};
