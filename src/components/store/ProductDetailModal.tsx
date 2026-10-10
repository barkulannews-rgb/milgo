import React, { useState } from 'react';
import { X, Star, Check } from 'lucide-react';
import { Product, ProductVariant, Language, StoreSettings } from '../../types';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface ProductDetailModalProps {
  product: Product | null;
  lang: Language;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  onBuyNow: (product: Product, variant: ProductVariant, quantity: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  lang,
  settings,
  isOpen,
  onClose,
  onAddToCart,
  onBuyNow,
  isWishlisted,
  onToggleWishlist,
}) => {
  if (!isOpen || !product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);

  const displayName = lang === 'so' && product.nameSo ? product.nameSo : product.name;
  const displayDesc = lang === 'so' && product.descriptionSo ? product.descriptionSo : product.description;

  const isOutOfStock = selectedVariant.stockQuantity <= 0;
  const isLowStock = !isOutOfStock && selectedVariant.stockQuantity <= selectedVariant.lowStockThreshold;

  const currentPrice = selectedVariant.discountPrice || selectedVariant.sellingPrice;
  const originalPrice = selectedVariant.discountPrice ? selectedVariant.sellingPrice : null;

  const handleAdd = () => {
    if (isOutOfStock) return;
    onAddToCart(product, selectedVariant, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1400);
  };

  const handleBuy = () => {
    if (isOutOfStock) return;
    onBuyNow(product, selectedVariant, quantity);
  };

  // WhatsApp order link generator
  const whatsappUrl = `https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hello ${settings.storeName}, I would like to order: ${product.name} (${selectedVariant.size}) for ${formatMoney(currentPrice)}. Is it available?`
  )}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div
        className="relative w-full max-w-4xl bg-surface overflow-hidden shadow-2xl text-fg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-fg-2 hover:text-fg transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[90vh] overflow-y-auto">
          {/* Left Column: Image Gallery & Swatches */}
          <div className="p-6 bg-surface-3 flex flex-col items-center justify-center">
            <div className="relative w-full aspect-square max-w-md overflow-hidden bg-surface mb-4">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={displayName}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 overflow-hidden cursor-pointer transition-opacity ${
                      activeImageIndex === idx ? 'ring-1 ring-fg' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="p-6 sm:p-8 flex flex-col justify-between bg-surface">
            <div>
              <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3">{product.brand}</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-fg mt-1 mb-2">{displayName}</h2>
              <div className="flex items-center gap-3 text-xs text-fg-3 mb-5">
                <span>{product.concentration}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-current text-gold" strokeWidth={0} />
                  {product.rating.toFixed(1)} ({product.reviewCount})
                </span>
              </div>

              <div className="flex items-baseline gap-3 mb-6 font-mono">
                <span className="text-2xl text-fg">{formatMoney(currentPrice)}</span>
                {originalPrice && <span className="text-sm text-fg-4 line-through">{formatMoney(originalPrice)}</span>}
                {isOutOfStock ? (
                  <span className="ml-auto font-sans text-xs text-red-600">{getTranslation(lang, 'outOfStock')}</span>
                ) : (
                  isLowStock && (
                    <span className="ml-auto font-sans text-xs text-amber-600">
                      {lang === 'so' ? `${selectedVariant.stockQuantity} kaliya ayaa haray` : `Only ${selectedVariant.stockQuantity} left`}
                    </span>
                  )
                )}
              </div>

              {/* Bottle Size Selector */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-2">
                  {getTranslation(lang, 'selectSize')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        setSelectedVariant(v);
                        if (quantity > v.stockQuantity) setQuantity(Math.max(1, v.stockQuantity));
                      }}
                      className={`min-w-16 px-4 py-2 text-sm border transition-colors cursor-pointer ${
                        selectedVariant.id === v.id ? 'border-fg text-fg' : 'border-line text-fg-3 hover:border-line-strong'
                      }`}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-fg-2 leading-relaxed mb-6">{displayDesc}</p>

              <dl className="grid grid-cols-3 gap-4 mb-6 py-4 border-y border-line text-xs">
                {(
                  [
                    ['topNotes', product.notes.top],
                    ['heartNotes', product.notes.heart],
                    ['baseNotes', product.notes.base],
                  ] as const
                ).map(([key, notes]) => (
                  <div key={key}>
                    <dt className="text-[11px] uppercase tracking-[0.14em] text-fg-3 mb-1">{getTranslation(lang, key)}</dt>
                    <dd className="text-fg-2 leading-relaxed">{notes.slice(0, 3).join(', ')}</dd>
                  </div>
                ))}
              </dl>

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[11px] uppercase tracking-[0.14em] text-fg-3">{getTranslation(lang, 'quantity')}</span>
                <div className="flex items-center border border-line-strong">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1 text-sm text-fg-2 hover:text-fg disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-mono">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(selectedVariant.stockQuantity, q + 1))}
                    disabled={quantity >= selectedVariant.stockQuantity || isOutOfStock}
                    className="px-3 py-1 text-sm text-fg-2 hover:text-fg disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`w-full py-3.5 text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  addedAnimation ? 'bg-[#15803d] text-white' : 'bg-inverse hover:bg-inverse-hover text-on-inverse'
                }`}
              >
                {addedAnimation && <Check className="w-4 h-4" />}
                <span>{addedAnimation ? (lang === 'so' ? 'Waa la daray' : 'Added') : getTranslation(lang, 'addToCart')}</span>
              </button>
              <button
                onClick={handleBuy}
                disabled={isOutOfStock}
                className="w-full py-3.5 text-xs uppercase tracking-[0.16em] border border-fg text-fg hover:bg-surface-3 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {getTranslation(lang, 'buyNow')}
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-fg-3 hover:text-fg underline underline-offset-4 pt-1 transition-colors"
              >
                {getTranslation(lang, 'whatsappInquiry')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
