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

const MEAL_NAMES = [
  'Desayuno',
  'Media Mañana',
  'Comida',
  'Merienda',
  'Cena',
  'Post-Entreno'
];

const DietBuilder = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [foods, setFoods] = useState([]);
  const [dietName, setDietName] = useState('');
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    initializeMeals();
  }, [clientId]);

  const fetchData = async () => {
    try {
      const [clientRes, foodsRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${clientId}`),
        axios.get(`${API_URL}/foods`)
      ]);
      setClient(clientRes.data);
      setFoods(foodsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const initializeMeals = () => {
    const initialMeals = MEAL_NAMES.map((name, index) => ({
      meal_number: index + 1,
      meal_name: name,
      foods: [],
      total_kcal: 0,
      total_protein: 0,
      total_carbs: 0,
      total_fats: 0
    }));
    setMeals(initialMeals);
  };

  const addFoodToMeal = (mealIndex) => {
    const newMeals = JSON.parse(JSON.stringify(meals));
    newMeals[mealIndex].foods.push({
      food_id: '',
      food_name: '',
      quantity_g: 100,
      kcal: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    });
    setMeals(newMeals);
  };

  const removeFoodFromMeal = (mealIndex, foodIndex) => {
    const updatedMeals = [...meals];
    updatedMeals[mealIndex].foods.splice(foodIndex, 1);
    recalculateMealTotals(updatedMeals, mealIndex);
    setMeals(updatedMeals);
  };

  const updateFoodInMeal = (mealIndex, foodIndex, field, value) => {
    const newMeals = JSON.parse(JSON.stringify(meals));
    const foodItem = newMeals[mealIndex].foods[foodIndex];

    if (field === 'food_id') {
      const selectedFood = foods.find(f => f.id === value);
      if (selectedFood) {
        foodItem.food_id = selectedFood.id;
        foodItem.food_name = selectedFood.name;
        const quantity = foodItem.quantity_g || 100;
        foodItem.kcal = (selectedFood.kcal_per_100g * quantity) / 100;
        foodItem.protein = (selectedFood.protein_per_100g * quantity) / 100;
        foodItem.carbs = (selectedFood.carbs_per_100g * quantity) / 100;
        foodItem.fats = (selectedFood.fats_per_100g * quantity) / 100;
      }
    } else if (field === 'quantity_g') {
      foodItem.quantity_g = parseFloat(value) || 0;
      const selectedFood = foods.find(f => f.id === foodItem.food_id);
      if (selectedFood) {
        const quantity = foodItem.quantity_g;
        foodItem.kcal = (selectedFood.kcal_per_100g * quantity) / 100;
        foodItem.protein = (selectedFood.protein_per_100g * quantity) / 100;
        foodItem.carbs = (selectedFood.carbs_per_100g * quantity) / 100;
        foodItem.fats = (selectedFood.fats_per_100g * quantity) / 100;
      }
    }

    recalculateMealTotals(newMeals, mealIndex);
    setMeals(newMeals);
  };

  const recalculateMealTotals = (mealsArray, mealIndex) => {
    const meal = mealsArray[mealIndex];
    meal.total_kcal = meal.foods.reduce((sum, f) => sum + (f.kcal || 0), 0);
    meal.total_protein = meal.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
    meal.total_carbs = meal.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
    meal.total_fats = meal.foods.reduce((sum, f) => sum + (f.fats || 0), 0);
  };

  const calculateDailyTotals = () => {
    return {
      kcal: meals.reduce((sum, m) => sum + m.total_kcal, 0),
      protein: meals.reduce((sum, m) => sum + m.total_protein, 0),
      carbs: meals.reduce((sum, m) => sum + m.total_carbs, 0),
      fats: meals.reduce((sum, m) => sum + m.total_fats, 0)
    };
  };

  const handleSaveDiet = async () => {
    if (!dietName.trim()) {
      toast.error('Por favor ingresa un nombre para la dieta');
      return;
    }

    // Validate that all meals have at least one food selected
    const validMeals = meals.filter(meal => meal.foods.length > 0 && meal.foods.some(f => f.food_id));
    
    if (validMeals.length === 0) {
      toast.error('Por favor agrega al menos un alimento a una comida');
      return;
    }

    // Filter out empty food items
    const cleanedMeals = validMeals.map(meal => ({
      ...meal,
      foods: meal.foods.filter(f => f.food_id)
    }));

    try {
      await axios.post(`${API_URL}/diets`, {
        client_id: clientId,
        name: dietName,
        meals: cleanedMeals
      });
      toast.success('Dieta guardada exitosamente');
      navigate(`/clients/${clientId}`);
    } catch (error) {
      toast.error('Error al guardar la dieta');
      console.error(error);
    }
  };

  const dailyTotals = calculateDailyTotals();

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="diet-builder-page">
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
                Constructor de Dietas
              </h1>
              <p className="text-sm text-zinc-500">{client?.name}</p>
            </div>
          </div>
          <Button
            onClick={handleSaveDiet}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12 transition-transform active:scale-95"
            data-testid="save-diet-button"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Dieta
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Diet Name */}
        <div className="rounded-none border border-zinc-800 bg-black p-6">
          <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nombre de la Dieta</Label>
          <Input
            value={dietName}
            onChange={(e) => setDietName(e.target.value)}
            placeholder="Ej: Dieta Volumen I"
            className="mt-2 rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
            data-testid="diet-name-input"
          />
        </div>

        {/* Daily Totals */}
        <div className="rounded-none border border-zinc-800 bg-zinc-950/50 p-6">
          <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-4">Totales Diarios</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Calorías</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-kcal">{Math.round(dailyTotals.kcal)}</span>
              <span className="text-sm text-zinc-500"> kcal</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Proteínas</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-protein">{Math.round(dailyTotals.protein)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Carbohidratos</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-carbs">{Math.round(dailyTotals.carbs)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
            <div>
              <span className="text-sm text-zinc-400 block mb-1">Grasas</span>
              <span className="text-3xl font-bold text-white font-heading" data-testid="daily-fats">{Math.round(dailyTotals.fats)}</span>
              <span className="text-sm text-zinc-500">g</span>
            </div>
          </div>
          {client?.target_kcal && (
            <div className="mt-4 text-sm text-zinc-500">
              Objetivo: {Math.round(client.target_kcal)} kcal | 
              Diferencia: <span className={dailyTotals.kcal < client.target_kcal ? 'text-yellow-500' : 'text-green-500'}>
                {Math.round(dailyTotals.kcal - client.target_kcal)} kcal
              </span>
            </div>
          )}
        </div>

        {/* Meals */}
        {meals.map((meal, mealIndex) => (
          <div key={meal.meal_number} className="rounded-none border border-zinc-800 bg-black p-6" data-testid={`meal-${meal.meal_number}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide">
                {meal.meal_name}
              </h2>
              <Button
                onClick={() => addFoodToMeal(mealIndex)}
                variant="ghost"
                className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                data-testid={`add-food-meal-${meal.meal_number}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Alimento
              </Button>
            </div>

            {/* Foods Table */}
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
                    {meal.foods.map((foodItem, foodIndex) => (
                      <tr 
                        key={foodIndex} 
                        className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                        data-testid={`food-item-${mealIndex}-${foodIndex}`}
                      >
                        <td className="py-2 px-2 border border-zinc-900">
                          <Select
                            value={foodItem.food_id}
                            onValueChange={(value) => updateFoodInMeal(mealIndex, foodIndex, 'food_id', value)}
                          >
                            <SelectTrigger className="rounded-none border-transparent bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 h-full w-full text-sm">
                              <SelectValue placeholder="Seleccionar..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-none bg-zinc-900 border-zinc-800 max-h-60">
                              {foods.map((food) => (
                                <SelectItem key={food.id} value={food.id}>
                                  {food.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2 px-2 border border-zinc-900">
                          <Input
                            type="number"
                            step="0.1"
                            value={foodItem.quantity_g}
                            onChange={(e) => updateFoodInMeal(mealIndex, foodIndex, 'quantity_g', e.target.value)}
                            className="rounded-none border-transparent bg-transparent hover:bg-zinc-900 focus:bg-zinc-900 h-full w-full px-2 py-1 text-sm text-center"
                          />
                        </td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">{Math.round(foodItem.kcal || 0)}</td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">{(foodItem.protein || 0).toFixed(1)}g</td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">{(foodItem.carbs || 0).toFixed(1)}g</td>
                        <td className="py-2 px-4 text-zinc-400 text-sm text-center border border-zinc-900">{(foodItem.fats || 0).toFixed(1)}g</td>
                        <td className="py-2 px-2 text-center border border-zinc-900">
                          <Button
                            onClick={() => removeFoodFromMeal(mealIndex, foodIndex)}
                            variant="ghost"
                            size="sm"
                            className="rounded-none hover:bg-red-900 text-red-400 hover:text-red-200"
                            data-testid={`remove-food-${mealIndex}-${foodIndex}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-zinc-900/80 font-bold text-white border-t-2 border-zinc-700">
                      <td className="py-3 px-4 uppercase text-xs tracking-wider border border-zinc-800" colSpan="2">TOTAL</td>
                      <td className="py-3 px-4 text-center border border-zinc-800" data-testid={`meal-total-kcal-${mealIndex}`}>{Math.round(meal.total_kcal)}</td>
                      <td className="py-3 px-4 text-center border border-zinc-800" data-testid={`meal-total-protein-${mealIndex}`}>{meal.total_protein.toFixed(1)}g</td>
                      <td className="py-3 px-4 text-center border border-zinc-800" data-testid={`meal-total-carbs-${mealIndex}`}>{meal.total_carbs.toFixed(1)}g</td>
                      <td className="py-3 px-4 text-center border border-zinc-800" data-testid={`meal-total-fats-${mealIndex}`}>{meal.total_fats.toFixed(1)}g</td>
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
