import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  FolderTree,
  Check,
  X,
  Search,
  LayoutGrid,
  List,
  Layers,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Edit2,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../../services/api';
import { containerVariants, itemVariants } from '../../utils/animations';
import { SkeletonCards } from '../../components/Skeleton';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected Category Drawer/Modal for Subcategory Management
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);

  // New Category Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [subcategoriesStr, setSubcategoriesStr] = useState('');
  const [kycDocsStr, setKycDocsStr] = useState('PAN Card, Business Registration Certificate');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await apiFetch('/api/admin/categories');
      setCategories(data);
      // Keep selectedCategory in sync if open
      if (selectedCategory) {
        const refreshed = data.find((c: any) => c._id === selectedCategory._id);
        if (refreshed) setSelectedCategory(refreshed);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubcategoryName.trim() || !selectedCategory) return;
    setIsSubmittingSub(true);
    try {
      await apiFetch(`/api/admin/categories/${selectedCategory._id}/subcategories`, {
        method: 'POST',
        body: JSON.stringify({
          name: newSubcategoryName.trim(),
          slug: newSubcategoryName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
        })
      });
      setNewSubcategoryName('');
      await loadCategories();
    } catch (err: any) {
      alert(`Error adding subcategory: ${err.message}`);
    } finally {
      setIsSubmittingSub(false);
    }
  };

  const handleDeleteSubcategory = async (subSlugOrId: string) => {
    if (!selectedCategory) return;
    if (!confirm('Are you sure you want to remove this subcategory?')) return;
    try {
      await apiFetch(`/api/admin/categories/${selectedCategory._id}/subcategories/${subSlugOrId}`, {
        method: 'DELETE'
      });
      await loadCategories();
    } catch (err: any) {
      alert(`Error deleting subcategory: ${err.message}`);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) => {
      const matchName = cat.name?.toLowerCase().includes(q);
      const matchSlug = cat.slug?.toLowerCase().includes(q);
      const matchDesc = cat.description?.toLowerCase().includes(q);
      const matchSubs = cat.subcategories?.some((s: any) => s.name?.toLowerCase().includes(q));
      const matchKyc = cat.kycRequirements?.some((k: any) => k.title?.toLowerCase().includes(q));
      return matchName || matchSlug || matchDesc || matchSubs || matchKyc;
    });
  }, [categories, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subcategories = subcategoriesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((subName) => ({
          name: subName,
          slug: subName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          isActive: true,
        }));

      const kycRequirements = kycDocsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((docTitle) => ({
          docKey: docTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
          title: docTitle,
          required: true,
          allowedExtensions: ['pdf', 'jpg', 'png'],
          maxSizeMB: 5,
        }));

      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug: slug.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description,
          subcategories,
          kycRequirements,
          allowMultipleSubcategories: true,
        }),
      });

      setShowAddModal(false);
      setName('');
      setSlug('');
      setDescription('');
      setSubcategoriesStr('');
      loadCategories();
    } catch (err: any) {
      alert(`Error creating category: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-[var(--accent-primary)] border border-indigo-500/20 shadow-2xs">
              <FolderTree className="w-5 h-5" />
            </span>
            <span>Categories & Dynamic Configuration</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure primary business categories, dynamic subcategories, and mandatory KYC requirements.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories, subcategories, or KYC proofs..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mr-1">
            View:
          </span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={4} gridCols="grid-cols-1 md:grid-cols-2" />
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xs">
          <FolderTree className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No categories found</h3>
          <p className="text-xs text-slate-400 mt-1">
            {searchQuery ? `No category matches "${searchQuery}".` : 'Get started by creating your first business category.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 text-xs text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              Clear search filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredCategories.map((cat, idx) => (
            <motion.div
              key={cat._id}
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              onClick={() => setSelectedCategory(cat)}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer group relative"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg group-hover:bg-sky-100 transition-colors">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all text-sky-500" />
                      </h3>
                      <span className="text-xs font-mono text-slate-400">/{cat.slug}</span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      cat.isActive
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {cat.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Subcategories preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                      Subcategories ({cat.subcategories?.length || 0})
                    </span>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                      Click to manage & add &rarr;
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      cat.subcategories.slice(0, 6).map((sub: any, sIdx: number) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-700 font-medium"
                        >
                          {sub.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400 italic">
                        No subcategories registered yet. Click card to add.
                      </span>
                    )}
                    {cat.subcategories && cat.subcategories.length > 6 && (
                      <span className="px-2 py-0.5 text-slate-400 text-xs font-mono">
                        +{cat.subcategories.length - 6} more
                      </span>
                    )}
                  </div>
                </div>

                {/* KYC Requirements preview */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
                    Mandatory KYC Proofs ({cat.kycRequirements?.length || 0})
                  </span>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    {cat.kycRequirements?.map((k: any, idx: number) => (
                      <li key={idx} className="flex items-center space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>{k.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* LIST VIEW */
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-xs"
        >
          {filteredCategories.map((cat, idx) => (
            <motion.div
              key={cat._id}
              variants={itemVariants}
              onClick={() => setSelectedCategory(cat)}
              className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5 flex-1">
                  <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 w-6 pt-2 shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="p-2.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl shrink-0 mt-0.5 group-hover:bg-sky-100 transition-colors">
                    <FolderTree className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-3 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <span>{cat.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all text-sky-500" />
                      </h3>
                      <span className="text-xs font-mono text-slate-400">/{cat.slug}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cat.isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {cat.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Subcategories snippet */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        Subcategories ({cat.subcategories?.length || 0})
                      </span>
                      <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
                        Manage &rarr;
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        cat.subcategories.slice(0, 4).map((sub: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] border border-slate-200 dark:border-slate-700 font-medium"
                          >
                            {sub.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-amber-600 italic">No subcategories</span>
                      )}
                      {(cat.subcategories?.length || 0) > 4 && (
                        <span className="px-1.5 py-0.5 text-slate-400 text-[11px] font-mono">
                          +{(cat.subcategories?.length || 0) - 4} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KYC Proofs snippet */}
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                      KYC Proofs ({cat.kycRequirements?.length || 0})
                    </span>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      {cat.kycRequirements?.slice(0, 2).map((k: any, idx: number) => (
                        <div key={idx} className="flex items-center space-x-1.5 truncate">
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate">{k.title}</span>
                        </div>
                      ))}
                      {(cat.kycRequirements?.length || 0) > 2 && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          +{(cat.kycRequirements?.length || 0) - 2} more requirements
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Modal for Creating New Category */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Add New Ecosystem Category</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    placeholder="e.g. Healthcare & Wellness"
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="healthcare-wellness"
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Doctors, clinic owners, diagnostic labs, and wellness centers."
                    rows={2}
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Subcategories (comma separated)
                  </label>
                  <input
                    type="text"
                    value={subcategoriesStr}
                    onChange={(e) => setSubcategoriesStr(e.target.value)}
                    placeholder="Clinics, Diagnostic Centers, Pharmaceuticals"
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Required KYC Documents (comma separated)
                  </label>
                  <input
                    type="text"
                    value={kycDocsStr}
                    onChange={(e) => setKycDocsStr(e.target.value)}
                    placeholder="Medical License, Clinical Establishment Certificate"
                    className="w-full text-sm p-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                  >
                    Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Modal / Drawer to View, Add, and Delete Subcategories */}
      <AnimatePresence>
        {selectedCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategory(null)}
              className="fixed inset-0 bg-slate-950 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-50 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl border border-sky-500/20">
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                        {selectedCategory.name}
                      </h3>
                      <span className="font-mono text-xs text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded">
                        /{selectedCategory.slug}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Manage subcategories and roles eligible under this ecosystem sector.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Add Subcategory Form */}
                <form
                  onSubmit={handleAddSubcategory}
                  className="bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 p-4 rounded-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>Add New Subcategory</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Instantly updates registration & portal</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="e.g. Organic Produce Aggregator, Diagnostic Lab, AI Specialist"
                      className="flex-1 text-xs px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingSub || !newSubcategoryName.trim()}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide transition-all active:scale-95 shadow-sm shrink-0 flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isSubmittingSub ? 'Adding...' : 'Add Subcategory'}</span>
                    </button>
                  </div>
                </form>

                {/* Subcategories List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                      Configured Subcategories ({selectedCategory.subcategories?.length || 0})
                    </span>
                    <span className="text-[11px] text-slate-400">Available to customers during onboarding</span>
                  </div>

                  {(!selectedCategory.subcategories || selectedCategory.subcategories.length === 0) ? (
                    <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                      No subcategories configured yet. Use the input above to add your first one.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedCategory.subcategories.map((sub: any, idx: number) => {
                        const subName = typeof sub === 'string' ? sub : sub.name;
                        const subSlug = typeof sub === 'string' ? sub.toLowerCase().replace(/[^a-z0-9]+/g, '-') : (sub.slug || sub._id);
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors group"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate block">
                                  {subName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 truncate block">
                                  /{subSlug}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSubcategory(subSlug)}
                              title="Delete subcategory"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mandatory KYC Proofs under this Category */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Mandatory KYC Compliance Proofs ({selectedCategory.kycRequirements?.length || 0})</span>
                  </span>
                  <div className="space-y-1.5">
                    {selectedCategory.kycRequirements?.map((k: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-slate-200">{k.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">({k.docKey})</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.required ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                          {k.required ? 'MANDATORY' : 'OPTIONAL'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="px-5 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-xs"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
