'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Utensils, Calculator, Printer, X } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
}

interface RecipeIngredient {
  _id?: string;
  product: Product | string;
  quantityPerMeal: number;
}

interface Recipe {
  _id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'manage' | 'calculator'>('manage');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: [] as { product: string; quantityPerMeal: number }[],
  });

  // Calculator state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [mealsCount, setMealsCount] = useState<number>(100);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recipesRes, productsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/products?category=Alimentação') // Assuming we only want food products
      ]);
      
      if (recipesRes.ok && productsRes.ok) {
        const recipesData = await recipesRes.json();
        const productsData = await productsRes.json();
        setRecipes(recipesData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description || '',
        ingredients: recipe.ingredients.map(i => ({
          product: typeof i.product === 'object' ? i.product._id : i.product,
          quantityPerMeal: i.quantityPerMeal
        }))
      });
    } else {
      setEditingRecipe(null);
      setFormData({ name: '', description: '', ingredients: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
    setFormData({ name: '', description: '', ingredients: [] });
  };

  const handleAddIngredient = () => {
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { product: '', quantityPerMeal: 0 }]
    });
  };

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients.splice(index, 1);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleIngredientChange = (index: number, field: string, value: string | number) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty ingredients
    const validIngredients = formData.ingredients.filter(i => i.product && i.quantityPerMeal > 0);
    const submitData = { ...formData, ingredients: validIngredients };

    try {
      const url = editingRecipe ? `/api/recipes/${editingRecipe._id}` : '/api/recipes';
      const method = editingRecipe ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        handleCloseModal();
        fetchData();
      } else {
        alert('Erro ao salvar cardápio');
      }
    } catch (error) {
      console.error('Failed to save recipe:', error);
      alert('Erro ao salvar cardápio');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cardápio?')) return;
    
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error);
    }
  };

  // Calculator logic
  const selectedRecipe = recipes.find(r => r._id === selectedRecipeId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-slate-900">Cardápios e Refeições</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 print:hidden">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('manage')}
            className={`${
              activeTab === 'manage'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
          >
            <Utensils className="mr-2 h-5 w-5" />
            Gerenciar Cardápios
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`${
              activeTab === 'calculator'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium flex items-center`}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Calculadora de Refeições
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : activeTab === 'manage' ? (
        <div className="space-y-4 print:hidden">
          <div className="flex justify-end">
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Cardápio
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <div key={recipe._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{recipe.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{recipe.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleOpenModal(recipe)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(recipe._id)}
                      className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-900">Ingredientes ({recipe.ingredients.length})</h4>
                  <ul className="mt-2 space-y-1">
                    {recipe.ingredients.slice(0, 3).map((ing, idx) => (
                      <li key={idx} className="text-sm text-slate-600 flex justify-between">
                        <span>{typeof ing.product === 'object' ? ing.product.name : 'Produto'}</span>
                        <span className="font-medium">{ing.quantityPerMeal} {typeof ing.product === 'object' ? ing.product.unit : ''}/refeição</span>
                      </li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="text-sm text-slate-400 italic">+{recipe.ingredients.length - 3} outros ingredientes</li>
                    )}
                  </ul>
                </div>
              </div>
            ))}
            {recipes.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500">
                Nenhum cardápio cadastrado.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm print:hidden">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Configurar Cálculo</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Selecione o Cardápio</label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                >
                  <option value="">-- Selecione --</option>
                  {recipes.map(r => (
                    <option key={r._id} value={r._id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Número de Refeições</label>
                <input
                  type="number"
                  min="1"
                  value={mealsCount}
                  onChange={(e) => setMealsCount(parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => window.print()}
                disabled={!selectedRecipe}
                className="flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Relatório
              </button>
            </div>
          </div>

          {/* Report Section - Visible on print */}
          {selectedRecipe && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-none print:shadow-none print:p-0">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold text-slate-900">Relatório de Insumos - Cardápio</h1>
                <p className="mt-2 text-lg text-slate-600">{selectedRecipe.name}</p>
                <p className="text-slate-500">Total de Refeições: <span className="font-bold text-slate-900">{mealsCount}</span></p>
              </div>

              <table className="min-w-full divide-y divide-slate-200 border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Produto / Ingrediente
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Qtd. por Refeição
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                      Unidade
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-900 bg-emerald-50">
                      Qtd. Total Necessária
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {selectedRecipe.ingredients.map((ing, idx) => {
                    const product = typeof ing.product === 'object' ? ing.product : products.find(p => p._id === ing.product);
                    const totalQuantity = ing.quantityPerMeal * mealsCount;
                    
                    return (
                      <tr key={idx}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {product ? product.name : 'Produto Desconhecido'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
                          {ing.quantityPerMeal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-500">
                          {product ? product.unit : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-emerald-700 bg-emerald-50/30">
                          {totalQuantity.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm text-slate-500 print:block hidden">
                <p>Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                <p className="mt-1">Sistema de Gestão de Estoque - Prof. João Florentino</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 print:hidden">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingRecipe ? 'Editar Cardápio' : 'Novo Cardápio'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="recipe-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nome do Cardápio</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                    placeholder="Ex: Arroz com Feijão e Carne"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Descrição (Opcional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-slate-900">Ingredientes</h3>
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar Ingrediente
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Produto</label>
                          <select
                            required
                            value={ing.product}
                            onChange={(e) => handleIngredientChange(idx, 'product', e.target.value)}
                            className="block w-full rounded-md border border-slate-300 px-3 py-1.5 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                          >
                            <option value="">Selecione um produto</option>
                            {products.map(p => (
                              <option key={p._id} value={p._id}>{p.name} ({p.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-slate-500 mb-1">Qtd/Refeição</label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.0001"
                            value={ing.quantityPerMeal || ''}
                            onChange={(e) => handleIngredientChange(idx, 'quantityPerMeal', parseFloat(e.target.value))}
                            className="block w-full rounded-md border border-slate-300 px-3 py-1.5 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-emerald-500 sm:text-sm"
                            placeholder="Ex: 0.15"
                          />
                        </div>
                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-slate-400 hover:text-red-500 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formData.ingredients.length === 0 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Nenhum ingrediente adicionado. Clique em "Adicionar Ingrediente".
                      </p>
                    )}
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-xl">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="recipe-form"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Salvar Cardápio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
