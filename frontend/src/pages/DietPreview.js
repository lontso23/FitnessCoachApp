import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Save, FileDown, Plus, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DietPreview = () => {
  const { id: clientId, dietId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [diet, setDiet] = useState(null);
  const [foods, setFoods] = useState([]);
  const [editedDiet, setEditedDiet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, [clientId, dietId]);

  const fetchData = async () => {
    try {
      const [clientRes, dietRes, foodsRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${clientId}`),
        axios.get(`${API_URL}/diets/${dietId}`),
        axios.get(`${API_URL}/foods`)
      ]);
      setClient(clientRes.data);
      setDiet(dietRes.data);
      setEditedDiet(JSON.parse(JSON.stringify(dietRes.data)));
      setFoods(foodsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const updateDietName = (name) => {
    const updated = { ...editedDiet, name };
    setEditedDiet(updated);
    setHasChanges(true);
  };

  const updateFood = (mealIdx, foodIdx, field, value) => {
    const updated = JSON.parse(JSON.stringify(editedDiet));
    const food = updated.meals[mealIdx].foods[foodIdx];

    if (field === 'food_id') {
      const selectedFood = foods.find(f => f.id === value);
      if (selectedFood) {
        food.food_id = selectedFood.id;
        food.food_name = selectedFood.name;
        const qty = food.quantity_g;
        food.kcal = (selectedFood.kcal_per_100g * qty) / 100;
        food.protein = (selectedFood.protein_per_100g * qty) / 100;
        food.carbs = (selectedFood.carbs_per_100g * qty) / 100;
        food.fats = (selectedFood.fats_per_100g * qty) / 100;
      }
    } else if (field === 'quantity_g') {
      food.quantity_g = parseFloat(value) || 0;
      const selectedFood = foods.find(f => f.id === food.food_id);
      if (selectedFood) {
        const qty = food.quantity_g;
        food.kcal = (selectedFood.kcal_per_100g * qty) / 100;
        food.protein = (selectedFood.protein_per_100g * qty) / 100;
        food.carbs = (selectedFood.carbs_per_100g * qty) / 100;
        food.fats = (selectedFood.fats_per_100g * qty) / 100;
      }
    }

    recalculateMealTotals(updated, mealIdx);
    recalculateDietTotals(updated);
    setEditedDiet(updated);
    setHasChanges(true);
  };

  const removeFood = (mealIdx, foodIdx) => {
    const updated = JSON.parse(JSON.stringify(editedDiet));
    updated.meals[mealIdx].foods.splice(foodIdx, 1);
    recalculateMealTotals(updated, mealIdx);
    recalculateDietTotals(updated);
    setEditedDiet(updated);
    setHasChanges(true);
  };

  const addFood = (mealIdx) => {
    const updated = JSON.parse(JSON.stringify(editedDiet));
    updated.meals[mealIdx].foods.push({
      food_id: '',
      food_name: '',
      quantity_g: 100,
      kcal: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
    setEditedDiet(updated);
    setHasChanges(true);
  };

  const recalculateMealTotals = (dietData, mealIdx) => {
    const meal = dietData.meals[mealIdx];
    meal.total_kcal = meal.foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
    meal.total_protein = meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    meal.total_carbs = meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    meal.total_fats = meal.foods.reduce((sum, f) => sum + (f.fats || 0), 0);
  };

  const recalculateDietTotals = (dietData) => {
    dietData.total_kcal = dietData.meals.reduce((sum, m) => sum + m.total_kcal, 0);
    dietData.total_protein = dietData.meals.reduce((sum, m) => sum + m.total_protein, 0);
    dietData.total_carbs = dietData.meals.reduce((sum, m) => sum + m.total_carbs, 0);
    dietData.total_fats = dietData.meals.reduce((sum, m) => sum + m.total_fats, 0);
  };

  const handleSaveChanges = async () => {
    try {
      const updatePayload = {
        client_id: clientId,
        name: editedDiet.name,
        meals: editedDiet.meals
      };
      await axios.put(`${API_URL}/diets/${dietId}`, updatePayload);
      toast.success('Cambios guardados');
      setHasChanges(false);
      setDiet(editedDiet);
    } catch (error) {
      toast.error('Error al guardar cambios');
    }
  };

  const handleExportPDF = async () => {
    try {
      // Si hay cambios sin guardar, guardarlos primero
      if (hasChanges) {
        await handleSaveChanges();
      }

      const response = await axios.get(`${API_URL}/diets/${dietId}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dieta_${client.name.replace(' ', '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF descargado');
    } catch (error) {
      toast.error('Error al exportar PDF');
    }
  };

  if (loading || !editedDiet) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="diet-preview-page">
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(`/clients/${clientId}`)}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
                Vista Previa y Edición
              </h1>
              <p className="text-sm text-zinc-500">{client?.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button
                onClick={handleSaveChanges}
                className="rounded-none bg-zinc-700 text-white hover:bg-zinc-600 font-bold uppercase tracking-wide px-6 h-12"
                data-testid="save-changes-button"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12"
              data-testid="export-pdf-button"
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Diet Name */}
        <div className="rounded-none border border-zinc-800 bg-black p-6">
          <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nombre de la Dieta</Label>
          <Input
            value={editedDiet.name}
            onChange={(e) => updateDietName(e.target.value)}
            className="mt-2 rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12 text-lg font-semibold"
            data-testid="diet-name-input"
          />
        </div>

        {/* Daily Totals */}
        <div className="rounded-none border border-zinc-800 bg-zinc-950/50 p-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4">Totales Diarios</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Calorías</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-kcal">{Math.round(editedDiet.total_kcal)}</span>
              <span className="text-sm text-zinc-500"> kcal</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Proteínas</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-protein">{Math.round(editedDiet.total_protein)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Carbohidratos</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-carbs">{Math.round(editedDiet.total_carbs)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Grasas</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-fats">{Math.round(editedDiet.total_fats)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
          </div>
        </div>

        {/* Meals */}
        {editedDiet.meals.map((meal, mIdx) => (
          <div key={mIdx} className="rounded-none border border-zinc-800 bg-black p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide">
                {meal.meal_name}
              </h2>
              <Button
                onClick={() => addFood(mIdx)}
                variant="ghost"
                className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                data-testid={`add-food-meal-${mIdx}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Alimento
              </Button>
            </div>

            {meal.foods.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-zinc-800">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                      <th className="text-left py-3 px-4 border border-zinc-800">Alimento</th>
                      <th className="text-left py-3 px-4 border border-zinc-800">Cantidad (g)</th>
                      <th className="text-left py-3 px-4 border border-zinc-800">Kcal</th>
                      <th className="text-left py-3 px-4 border border-zinc-800">Proteínas</th>
                      <th className="text-left py-3 px-4 border border-zinc-800">Carbohidratos</th>
                      <th className="text-left py-3 px-4 border border-zinc-800">Grasas</th>
                      <th className="text-center py-3 px-4 border border-zinc-800">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meal.foods.map((food, fIdx) => (
                      <tr key={fIdx} className="border-b border-zinc-900 hover:bg-zinc-900/50">
                        <td className="py-2 px-2 border border-zinc-900">
                          <Select
                            value={food.food_id}
                            onValueChange={(v) => updateFood(mIdx, fIdx, 'food_id', v)}
                          >
                            <SelectTrigger className="rounded-none border-transparent bg-transparent hover:bg-zinc-900 h-full w-full text-sm">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-none bg-zinc-900 border-zinc-800 max-h-60">
                              {foods.map((f) => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 border border-zinc-900">
                          <Input
                            type="number"
                            step="0.1"
                            value={food.quantity_g}
                            onChange={(e) => updateFood(mIdx, fIdx, 'quantity_g', e.target.value)}
                            className="rounded-none border-transparent bg-transparent hover:bg-zinc-900 h-full w-full px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">
                          {Math.round(food.kcal || 0)}
                        </td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">
                          {(food.protein || 0).toFixed(1)}g
                        </td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">
                          {(food.carbs || 0).toFixed(1)}g
                        </td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">
                          {(food.fats || 0).toFixed(1)}g
                        </td>
                        <td className="py-2 px-2 text-center border border-zinc-900">
                          <Button
                            onClick={() => removeFood(mIdx, fIdx)}
                            variant="ghost"
                            size="sm"
                            className="rounded-none hover:bg-red-900 text-red-400 hover:text-red-200"
                            data-testid={`remove-food-${mIdx}-${fIdx}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-900/80 font-bold text-white border-t-2 border-zinc-700">
                      <td className="py-3 px-4 uppercase text-xs tracking-wider border border-zinc-800" colSpan="2">
                        TOTAL
                      </td>
                      <td className="py-3 px-4 text-center border border-zinc-800">{Math.round(meal.total_kcal)}</td>
                      <td className="py-3 px-4 text-center border border-zinc-800">{meal.total_protein.toFixed(1)}g</td>
                      <td className="py-3 px-4 text-center border border-zinc-800">{meal.total_carbs.toFixed(1)}g</td>
                      <td className="py-3 px-4 text-center border border-zinc-800">{meal.total_fats.toFixed(1)}g</td>
                      <td className="border border-zinc-800"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {meal.foods.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No hay alimentos en esta comida
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default DietPreview;
