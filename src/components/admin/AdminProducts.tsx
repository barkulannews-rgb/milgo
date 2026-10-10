import React, { useState } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Download,
  Search,
  Check,
  X,
  Layers,
} from 'lucide-react';
import { Product, ProductVariant, FragranceFamily, FragranceConcentration, GenderCategory, Language } from '../../types';
import { storeRepo } from '../../lib/storage';
import { getTranslation } from '../../lib/translations';

import { formatMoney } from '../../lib/money';
interface AdminProductsProps {
  lang: Language;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ lang }) => {
  const [products, setProducts] = useState<Product[]>(storeRepo.getProducts());
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshProducts = () => {
    setProducts(storeRepo.getProducts());
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.nameSo && p.nameSo.toLowerCase().includes(search.toLowerCase())) ||
      p.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenAdd = () => {
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: '',
      nameSo: '',
      brand: 'DK Signature',
      category: 'Luxury Oud',
      fragranceFamily: 'Oriental',
      concentration: 'Eau de Parfum',
      gender: 'Unisex',
      description: '',
      descriptionSo: '',
      images: ['/images/hero_luxury_perfume_1791620587322.jpg'],
      notes: {
        top: ['Bergamot', 'Saffron'],
        heart: ['Rose', 'Amber'],
        base: ['Oud', 'Vanilla', 'Musk'],
      },
      variants: [
        {
          id: `var-${Date.now()}-50`,
          size: '50ml',
          sku: `MLG-${Math.floor(Math.random() * 900 + 100)}-50`,
          costPrice: 40.0,
          sellingPrice: 95.0,
          stockQuantity: 15,
          lowStockThreshold: 4,
        },
        {
          id: `var-${Date.now()}-100`,
          size: '100ml',
          sku: `MLG-${Math.floor(Math.random() * 900 + 100)}-100`,
          costPrice: 60.0,
          sellingPrice: 145.0,
          stockQuantity: 10,
          lowStockThreshold: 3,
        },
      ],
      featured: false,
      bestSeller: false,
      isNewArrival: true,
      active: true,
      authenticityVerified: true,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    setEditingProduct(newProd);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(JSON.parse(JSON.stringify(prod)));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this fragrance?')) {
      storeRepo.deleteProduct(id);
      refreshProducts();
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!editingProduct.name.trim()) {
      alert('Please enter perfume name.');
      return;
    }
    storeRepo.saveProduct(editingProduct);
    setIsModalOpen(false);
    setEditingProduct(null);
    refreshProducts();
  };

  const exportCsv = () => {
    const headers = ['ID', 'Name', 'Name (Somali)', 'Brand', 'Category', 'Family', 'Concentration', 'Variants Count', 'Total Stock'];
    const rows = products.map((p) => [
      p.id,
      `"${p.name}"`,
      `"${p.nameSo || ''}"`,
      `"${p.brand}"`,
      `"${p.category}"`,
      p.fragranceFamily,
      p.concentration,
      p.variants.length,
      p.variants.reduce((s, v) => s + v.stockQuantity, 0),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `milgo_fragrances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <h1 className="font-serif text-3xl text-fg">
            {getTranslation(lang, 'adminProducts')}
          </h1>
          
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCsv}
            className="px-3.5 py-2 bg-surface hover:bg-surface-3 border border-line-strong text-xs font-medium text-fg-2 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            <span>{getTranslation(lang, 'exportCsv')}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#9b783e] hover:bg-[#85632e] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{getTranslation(lang, 'addNewProduct')}</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-4" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, Somali name, brand..."
          className="w-full bg-surface border border-line-strong focus:border-gold pl-9 pr-4 py-2 text-xs text-fg outline-none"
        />
      </div>

      {/* Table of Products */}
      <div className="bg-surface border border-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 border-b border-line text-fg-2 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-4">Fragrance</th>
                <th className="py-3.5 px-4">Brand & Category</th>
                <th className="py-3.5 px-4">Family</th>
                <th className="py-3.5 px-4">Concentration</th>
                <th className="py-3.5 px-4">Variants / Sizes</th>
                <th className="py-3.5 px-4">Total Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg-2">
              {filtered.map((prod) => {
                const totalStock = prod.variants.reduce((s, v) => s + v.stockQuantity, 0);
                return (
                  <tr key={prod.id} className="hover:bg-surface-2 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images[0] || '/images/hero_luxury_perfume_1791620587322.jpg'}
                          alt={prod.name}
                          className="w-10 h-10 object-cover bg-surface-2 shrink-0 border border-line"
                        />
                        <div>
                          <div className="font-medium text-fg">{prod.name}</div>
                          {prod.nameSo && (
                            <div className="text-[11px] text-fg-3">{prod.nameSo}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-fg font-medium">{prod.brand}</div>
                      <div className="text-[11px] text-fg-3">{prod.category}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">{prod.fragranceFamily}</td>
                    <td className="py-3.5 px-4 text-fg-3">{prod.concentration}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {prod.variants.map((v) => (
                          <span
                            key={v.id}
                            className="px-1.5 py-0.5 bg-surface-2 border border-line text-[10px] font-mono text-gold-deep font-medium"
                          >
                            {v.size}: {formatMoney((v.discountPrice || v.sellingPrice))} ({v.stockQuantity})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums font-semibold">
                      <span className={totalStock <= 5 ? 'text-amber-600' : 'text-emerald-700'}>
                        {totalStock} units
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 font-semibold ${
                          prod.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {prod.active ? 'Active' : 'Archived'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-1.5 text-fg-3 hover:text-gold hover:bg-surface-3 transition-colors cursor-pointer"
                          title="Edit product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 text-fg-3 hover:text-red-600 hover:bg-surface-3 transition-colors cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-surface border border-line rounded-2xl overflow-hidden shadow-2xl text-fg">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h2 className="font-serif text-2xl font-medium tracking-wide">
                {editingProduct.id.startsWith('prod-') && editingProduct.name ? 'Edit Fragrance' : 'New Fragrance Flacon'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-fg-3 hover:text-fg rounded-full hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Perfume Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Magaca Cadarka (Soomaali)</label>
                  <input
                    type="text"
                    value={editingProduct.nameSo}
                    onChange={(e) => setEditingProduct({ ...editingProduct, nameSo: e.target.value })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Brand</label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Olfactory Family</label>
                  <select
                    value={editingProduct.fragranceFamily}
                    onChange={(e) => setEditingProduct({ ...editingProduct, fragranceFamily: e.target.value as FragranceFamily })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  >
                    <option value="Oriental">Oriental</option>
                    <option value="Woody">Woody</option>
                    <option value="Floral">Floral</option>
                    <option value="Fresh">Fresh</option>
                    <option value="Citrus">Citrus</option>
                    <option value="Gourmand">Gourmand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Concentration</label>
                  <select
                    value={editingProduct.concentration}
                    onChange={(e) => setEditingProduct({ ...editingProduct, concentration: e.target.value as FragranceConcentration })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  >
                    <option value="Eau de Parfum">Eau de Parfum</option>
                    <option value="Extrait de Parfum">Extrait de Parfum</option>
                    <option value="Eau de Toilette">Eau de Toilette</option>
                    <option value="Parfum">Parfum</option>
                    <option value="Cologne">Cologne</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Audience / Gender</label>
                  <select
                    value={editingProduct.gender}
                    onChange={(e) => setEditingProduct({ ...editingProduct, gender: e.target.value as GenderCategory })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  >
                    <option value="Unisex">Unisex</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Image URL</label>
                  <input
                    type="text"
                    value={editingProduct.images[0] || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg font-mono outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Description (English)</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-fg-2 mb-1 font-medium">Faallada (Soomaali)</label>
                  <textarea
                    rows={2}
                    value={editingProduct.descriptionSo}
                    onChange={(e) => setEditingProduct({ ...editingProduct, descriptionSo: e.target.value })}
                    className="w-full bg-surface-2 border border-line-strong focus:border-gold p-2.5 text-xs text-fg outline-none"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="pt-4 border-t border-line">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-wider text-gold-deep font-semibold">
                    Bottle Sizes & Variants (Price & Stock)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ProductVariant = {
                        id: `var-${Date.now()}-${Math.floor(Math.random() * 100)}`,
                        size: '100ml',
                        sku: `MLG-${Math.floor(Math.random() * 900 + 100)}`,
                        costPrice: 50.0,
                        sellingPrice: 120.0,
                        stockQuantity: 10,
                        lowStockThreshold: 3,
                      };
                      setEditingProduct({
                        ...editingProduct,
                        variants: [...editingProduct.variants, newVar],
                      });
                    }}
                    className="px-2.5 py-1 text-xs bg-surface text-gold-deep border border-line-strong hover:bg-surface-2 cursor-pointer font-medium"
                  >
                    + Add Size Variant
                  </button>
                </div>

                <div className="space-y-3">
                  {editingProduct.variants.map((v, idx) => (
                    <div key={v.id} className="p-3 bg-surface-2 border border-line grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-fg-3 block">Size</span>
                        <input
                          type="text"
                          value={v.size}
                          onChange={(e) => {
                            const copy = [...editingProduct.variants];
                            copy[idx].size = e.target.value;
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full bg-surface border border-line-strong p-1.5 text-xs text-fg"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-fg-3 block">SKU</span>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const copy = [...editingProduct.variants];
                            copy[idx].sku = e.target.value;
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full bg-surface border border-line-strong p-1.5 text-xs text-fg font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-fg-3 block">Cost Price (£)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={v.costPrice}
                          onChange={(e) => {
                            const copy = [...editingProduct.variants];
                            copy[idx].costPrice = parseFloat(e.target.value) || 0;
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full bg-surface border border-line-strong p-1.5 text-xs text-fg font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-fg-3 block">Selling Price (£)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={v.sellingPrice}
                          onChange={(e) => {
                            const copy = [...editingProduct.variants];
                            copy[idx].sellingPrice = parseFloat(e.target.value) || 0;
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full bg-surface border border-line-strong p-1.5 text-xs text-fg font-mono"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-fg-3 block">Stock Qty</span>
                        <input
                          type="number"
                          value={v.stockQuantity}
                          onChange={(e) => {
                            const copy = [...editingProduct.variants];
                            copy[idx].stockQuantity = parseInt(e.target.value) || 0;
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full bg-surface border border-line-strong p-1.5 text-xs text-fg font-mono"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingProduct.variants.length <= 1) {
                              alert('At least one size variant is required.');
                              return;
                            }
                            const copy = editingProduct.variants.filter((_, i) => i !== idx);
                            setEditingProduct({ ...editingProduct, variants: copy });
                          }}
                          className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] cursor-pointer font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-line text-xs text-fg-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.active}
                    onChange={(e) => setEditingProduct({ ...editingProduct, active: e.target.checked })}
                    className="accent-gold"
                  />
                  <span>Active Listing</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="accent-gold"
                  />
                  <span>Featured Collection</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.bestSeller}
                    onChange={(e) => setEditingProduct({ ...editingProduct, bestSeller: e.target.checked })}
                    className="accent-gold"
                  />
                  <span>Bestseller</span>
                </label>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-6 border-t border-line">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-3 text-fg-2 border border-line-strong text-xs font-medium cursor-pointer"
                >
                  {getTranslation(lang, 'cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-inverse hover:bg-inverse-hover text-on-inverse text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md"
                >
                  {getTranslation(lang, 'saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
