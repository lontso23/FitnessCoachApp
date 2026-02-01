import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const DietBuilder = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [foods, setFoods] = useState([]);
  const [dietName, setDietName] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  const mealNames = ['Desayuno', 'Media Mañana', 'Comida', 'Merienda', 'Cena', 'Post-Entreno'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const clientRes = await axios.get(`${API_URL}/clients/${clientId}`);
      const foodsRes = await axios.get(`${API_URL}/foods`);
      setClient(clientRes.data);
      setFoods(foodsRes.data);
      
      const initialMeals = mealNames.map((name, idx) => ({
        meal_number: idx + 1,
        meal_name: name,
        foods: [],
        total_kcal: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fats: 0
      }));
      setMeals(initialMeals);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const addFood = (mealIdx) => {
    const newMeals = [...meals];
    newMeals[mealIdx] = {
      ...newMeals[mealIdx],
      foods: [...newMeals[mealIdx].foods, {
        food_id: '',
        food_name: '',
        quantity_g: 100,
        kcal: 0,
        protein: 0,
        carbs: 0,
        fats: 0
      }]
    };
    setMeals(newMeals);
  };

  const removeFood = (mealIdx, foodIdx) => {
    const newMeals = [...meals];
    const newFoods = [...newMeals[mealIdx].foods];
    newFoods.splice(foodIdx, 1);
    newMeals[mealIdx] = { ...newMeals[mealIdx], foods: newFoods };
    calcTotals(newMeals, mealIdx);
    setMeals(newMeals);
  };

  const updateFood = (mealIdx, foodIdx, field, value) => {
    const newMeals = [...meals];
    const newFoods = [...newMeals[mealIdx].foods];
    const food = { ...newFoods[foodIdx] };

    if (field === 'food_id') {
      const selected = foods.find(f => f.id === value);
      if (selected) {
        food.food_id = selected.id;
        food.food_name = selected.name;
        const qty = food.quantity_g;
        food.kcal = (selected.kcal_per_100g * qty) / 100;
        food.protein = (selected.protein_per_100g * qty) / 100;
        food.carbs = (selected.carbs_per_100g * qty) / 100;
        food.fats = (selected.fats_per_100g * qty) / 100;
      }
    } else if (field === 'quantity_g') {
      food.quantity_g = parseFloat(value) || 0;
      const selected = foods.find(f => f.id === food.food_id);
      if (selected) {
        const qty = food.quantity_g;
        food.kcal = (selected.kcal_per_100g * qty) / 100;
        food.protein = (selected.protein_per_100g * qty) / 100;
        food.carbs = (selected.carbs_per_100g * qty) / 100;
        food.fats = (selected.fats_per_100g * qty) / 100;
      }
    }

    newFoods[foodIdx] = food;
    newMeals[mealIdx] = { ...newMeals[mealIdx], foods: newFoods };
    calcTotals(newMeals, mealIdx);
    setMeals(newMeals);
  };

  const calcTotals = (mealsArr, mealIdx) => {
    const meal = mealsArr[mealIdx];
    const totalKcal = meal.foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
    const totalProtein = meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    const totalCarbs = meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    const totalFats = meal.foods.reduce((sum, f) => sum + (f.fats || 0), 0);
    
    mealsArr[mealIdx] = {
      ...meal,
      total_kcal: totalKcal,
      total_protein: totalProtein,
      total_carbs: totalCarbs,
      total_fats: totalFats
    };
  };

  const getDailyTotals = () => {
    let kcal = 0, protein = 0, carbs = 0, fats = 0;
    meals.forEach(m => {
      kcal += m.total_kcal;
      protein += m.total_protein;
      carbs += m.total_carbs;
      fats += m.total_fats;
    });
    return { kcal, protein, carbs, fats };
  };

  const saveDiet = async () => {
    if (!dietName.trim()) {
      toast.error('Por favor ingresa un nombre para la dieta');
      return;
    }

    const validMeals = meals.filter(m => m.foods.length > 0 && m.foods.some(f => f.food_id));
    
    if (validMeals.length === 0) {
      toast.error('Por favor agrega al menos un alimento');
      return;
    }

    const cleanMeals = validMeals.map(m => ({
      ...m,
      foods: m.foods.filter(f => f.food_id)
    }));

    try {
      await axios.post(`${API_URL}/diets`, {
        client_id: clientId,
        name: dietName,
        meals: cleanMeals
      });
      toast.success('Dieta guardada exitosamente');
      navigate(`/clients/${clientId}`);
    } catch (error) {
      toast.error('Error al guardar la dieta');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  const dailyTotals = getDailyTotals();

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="diet-builder-page">
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate(`/clients/${clientId}`)}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-white font-heading">
                Constructor de Dietas
              </h1>
              <p className="text-sm text-zinc-500">{client?.name}</p>
            </div>
          </div>
          <Button
            onClick={saveDiet}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12"
            data-testid="save-diet-button"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Dieta
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 space-y-8">
        <div className="rounded-none border border-zinc-800 bg-black p-6">
          <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nombre de la Dieta</Label>
          <Input
            value={dietName}
            onChange={(e) => setDietName(e.target.value)}
            placeholder="Ej: Dieta Volumen I"
            className="mt-2 rounded-none border-zinc-800 bg-zinc-950/50 h-12"
            data-testid="diet-name-input"
          />
        </div>

        <div className="rounded-none border border-zinc-800 bg-zinc-950/50 p-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4">Totales Diarios</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Calorías</span>
              <span className="text-3xl font-bold text-white font-heading">{Math.round(dailyTotals.kcal)}</span>
              <span className="text-sm text-zinc-500"> kcal</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Proteínas</span>
              <span className="text-3xl font-bold text-white font-heading">{Math.round(dailyTotals.protein)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Carbohidratos</span>
              <span className="text-3xl font-bold text-white font-heading">{Math.round(dailyTotals.carbs)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Grasas</span>
              <span className="text-3xl font-bold text-white font-heading">{Math.round(dailyTotals.fats)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
          </div>
        </div>

        {meals.map((meal, mIdx) => (
          <div key={mIdx} className="rounded-none border border-zinc-800 bg-black p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide">
                {meal.meal_name}
              </h2>
              <Button
                onClick={() => addFood(mIdx)}
                variant="ghost"
                className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
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
                No hay alimentos agregados a esta comida
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};

export default DietBuilder;
