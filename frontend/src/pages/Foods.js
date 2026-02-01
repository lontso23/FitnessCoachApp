import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Plus, Trash2, Edit, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Foods = () => {
  const navigate = useNavigate();
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    kcal_per_100g: '',
    protein_per_100g: '',
    carbs_per_100g: '',
    fats_per_100g: ''
  });

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await axios.get(`${API_URL}/foods`);
      setFoods(response.data);
    } catch (error) {
      toast.error('Error al cargar alimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFood) {
        await axios.put(`${API_URL}/foods/${editingFood.id}`, formData);
        toast.success('Alimento actualizado');
      } else {
        await axios.post(`${API_URL}/foods`, formData);
        toast.success('Alimento creado');
      }
      setDialogOpen(false);
      resetForm();
      fetchFoods();
    } catch (error) {
      toast.error('Error al guardar alimento');
    }
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setFormData(food);
    setDialogOpen(true);
  };

  const handleDelete = async (foodId) => {
    try {
      await axios.delete(`${API_URL}/foods/${foodId}`);
      toast.success('Alimento eliminado');
      fetchFoods();
    } catch (error) {
      toast.error('Error al eliminar alimento');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      kcal_per_100g: '',
      protein_per_100g: '',
      carbs_per_100g: '',
      fats_per_100g: ''
    });
    setEditingFood(null);
  };

  const filteredFoods = foods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="foods-page">
      <header className="border-b border-zinc-800 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="ghost"
            className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white"
            data-testid="back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-white font-heading">
            Base de Datos de Alimentos
          </h1>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8">
        {/* Search and Add */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Buscar alimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
              data-testid="search-food-input"
            />
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button
                className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12 transition-transform active:scale-95"
                data-testid="add-food-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Alimento
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none bg-zinc-900 border-zinc-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white font-heading uppercase">
                  {editingFood ? 'Editar Alimento' : 'Nuevo Alimento'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="food-form">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                    data-testid="food-name-input"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Kcal por 100g</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.kcal_per_100g}
                    onChange={(e) => setFormData({ ...formData, kcal_per_100g: parseFloat(e.target.value) })}
                    required
                    className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                    data-testid="food-kcal-input"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Proteínas por 100g (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.protein_per_100g}
                    onChange={(e) => setFormData({ ...formData, protein_per_100g: parseFloat(e.target.value) })}
                    required
                    className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                    data-testid="food-protein-input"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Carbohidratos por 100g (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.carbs_per_100g}
                    onChange={(e) => setFormData({ ...formData, carbs_per_100g: parseFloat(e.target.value) })}
                    required
                    className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                    data-testid="food-carbs-input"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grasas por 100g (g)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fats_per_100g}
                    onChange={(e) => setFormData({ ...formData, fats_per_100g: parseFloat(e.target.value) })}
                    required
                    className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                    data-testid="food-fats-input"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide h-12"
                  data-testid="save-food-button"
                >
                  {editingFood ? 'Actualizar' : 'Crear'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Foods Table */}
        <div className="rounded-none border border-zinc-800 bg-black overflow-hidden">
          <table className="w-full" data-testid="foods-table">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="text-left py-3 px-4">Alimento</th>
                <th className="text-left py-3 px-4">Kcal/100g</th>
                <th className="text-left py-3 px-4">Proteínas/100g</th>
                <th className="text-left py-3 px-4">Carbohidratos/100g</th>
                <th className="text-left py-3 px-4">Grasas/100g</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-zinc-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredFoods.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-zinc-500">
                    No se encontraron alimentos
                  </td>
                </tr>
              ) : (
                filteredFoods.map((food) => (
                  <tr
                    key={food.id}
                    className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors"
                    data-testid={`food-row-${food.id}`}
                  >
                    <td className="py-3 px-4 text-white font-medium">{food.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{food.kcal_per_100g.toFixed(1)}</td>
                    <td className="py-3 px-4 text-zinc-400">{food.protein_per_100g.toFixed(1)}g</td>
                    <td className="py-3 px-4 text-zinc-400">{food.carbs_per_100g.toFixed(1)}g</td>
                    <td className="py-3 px-4 text-zinc-400">{food.fats_per_100g.toFixed(1)}g</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(food)}
                          variant="ghost"
                          size="sm"
                          className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white"
                          data-testid={`edit-food-button-${food.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-none hover:bg-red-900 text-red-400 hover:text-red-200"
                              data-testid={`delete-food-button-${food.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white font-heading uppercase">¿Eliminar alimento?</AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none border-zinc-700 bg-transparent text-white hover:bg-zinc-800">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(food.id)} 
                                className="rounded-none bg-red-600 text-white hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Foods;
