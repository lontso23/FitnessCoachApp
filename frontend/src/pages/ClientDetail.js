import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Edit, Trash2, Plus, FileDown, Eye, TrendingUp, Calculator, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { MacroCalculator } from '../components/MacroCalculator';
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

const ClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [diets, setDiets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [macroMode, setMacroMode] = useState('percentage'); // 'percentage' or 'grams'
  const [macroGrams, setMacroGrams] = useState({ protein: 0, carbs: 0, fats: 0 });
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [clientRes, dietsRes] = await Promise.all([
        axios.get(`${API_URL}/clients/${id}`),
        axios.get(`${API_URL}/diets?client_id=${id}`)
      ]);
      setClient(clientRes.data);
      setEditData(clientRes.data);
      setDiets(dietsRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClient = async () => {
    try {
      await axios.put(`${API_URL}/clients/${id}`, editData);
      toast.success('Cliente actualizado');
      setClient(editData);
      setEditMode(false);
      fetchData();
    } catch (error) {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteClient = async () => {
    try {
      await axios.delete(`${API_URL}/clients/${id}`);
      toast.success('Cliente eliminado');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleDeleteDiet = async (dietId) => {
    try {
      await axios.delete(`${API_URL}/diets/${dietId}`);
      toast.success('Dieta eliminada');
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar dieta');
    }
  };

  const handleExportPDF = async (dietId) => {
    try {
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

  // Calcular TMB usando Harris-Benedict
  const calculateTMB = (sex, weight, height, age) => {
    if (sex === 'H') {
      return 66.5 + (13.75 * weight) + (5.003 * height) - (6.75 * age);
    } else {
      return 655.1 + (9.563 * weight) + (1.850 * height) - (4.676 * age);
    }
  };

  // Calcular kcal de mantenimiento
  const calculateMaintenance = (tmb, activityLevel) => {
    const multipliers = {
      sedentaria: 1.2,
      ligera: 1.375,
      moderada: 1.55,
      alta: 1.725,
      muy_alta: 1.9
    };
    return tmb * (multipliers[activityLevel] || 1.2);
  };

  // Recalcular automáticamente TMB y kcal
  const handleRecalculate = () => {
    const tmb = calculateTMB(
      editData.sex,
      editData.weight,
      editData.height,
      editData.age
    );
    const maintenance = calculateMaintenance(tmb, editData.activity_level);
    
    setEditData({
      ...editData,
      tmb: Math.round(tmb),
      maintenance_kcal: Math.round(maintenance),
      target_kcal: Math.round(maintenance)
    });
    
    toast.success('Valores recalculados');
  };

  // Cambiar a modo gramos
  const switchToGramsMode = () => {
    if (editData.target_kcal) {
      const proteinKcal = (editData.target_kcal * editData.protein_percentage) / 100;
      const carbsKcal = (editData.target_kcal * editData.carbs_percentage) / 100;
      const fatsKcal = (editData.target_kcal * editData.fats_percentage) / 100;

      setMacroGrams({
        protein: Math.round(proteinKcal / 4),
        carbs: Math.round(carbsKcal / 4),
        fats: Math.round(fatsKcal / 9)
      });
    }
    setMacroMode('grams');
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cargando...</div>;
  }

  if (!client) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Cliente no encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="client-detail-page">
      <header className="border-b border-zinc-800 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white"
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-3xl font-bold uppercase tracking-tight text-white font-heading">
              {client.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setEditMode(!editMode)}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
              data-testid="edit-button"
            >
              <Edit className="w-4 h-4 mr-2" />
              {editMode ? 'Cancelar' : 'Editar'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-none hover:bg-red-900 text-red-400 hover:text-red-200 uppercase tracking-wider text-xs"
                  data-testid="delete-client-button"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none bg-zinc-900 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white font-heading uppercase">¿Eliminar cliente?</AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Esta acción no se puede deshacer. Se eliminará el cliente y todas sus dietas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none border-zinc-700 bg-transparent text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteClient} className="rounded-none bg-red-600 text-white hover:bg-red-700">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 space-y-8">
        {/* Client Info */}
        <div className="rounded-none border border-zinc-800 bg-black p-6">
          <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide mb-6">
            Datos del Cliente
          </h2>

          {editMode ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Edad</Label>
                <Input
                  type="number"
                  value={editData.age}
                  onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-age-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.weight}
                  onChange={(e) => setEditData({ ...editData, weight: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-weight-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Altura (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.height}
                  onChange={(e) => setEditData({ ...editData, height: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-height-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">TMB</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.tmb}
                  onChange={(e) => setEditData({ ...editData, tmb: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-tmb-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Kcal Mantenimiento</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.maintenance_kcal}
                  onChange={(e) => setEditData({ ...editData, maintenance_kcal: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-maintenance-input"
                />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Kcal Objetivo</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editData.target_kcal}
                  onChange={(e) => setEditData({ ...editData, target_kcal: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 h-12"
                  data-testid="edit-target-input"
                />
              </div>
              
              {/* Calculadora de Macros */}
              <div className="md:col-span-3 mt-6 p-6 bg-zinc-950/30 rounded-none border border-zinc-800">
                <MacroCalculator
                  editData={editData}
                  setEditData={setEditData}
                  macroMode={macroMode}
                  setMacroMode={setMacroMode}
                  macroGrams={macroGrams}
                  updateMacroGrams={updateMacroGrams}
                  switchToGramsMode={switchToGramsMode}
                  handleRecalculate={handleRecalculate}
                />
              </div>

              <div className="md:col-span-3">
                <Button
                  onClick={handleUpdateClient}
                  className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide h-12"
                  data-testid="save-button"
                >
                  Guardar Cambios
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Edad</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-age">{client.age} años</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Sexo</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-sex">{client.sex === 'H' ? 'Hombre' : 'Mujer'}</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Peso</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-weight">{client.weight} kg</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Altura</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-height">{client.height} cm</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">TMB</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-tmb">{client.tmb ? Math.round(client.tmb) : '-'} kcal</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Kcal Mantenimiento</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-maintenance">{client.maintenance_kcal ? Math.round(client.maintenance_kcal) : '-'} kcal</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Kcal Objetivo</span>
                <span className="text-2xl font-bold text-white font-heading" data-testid="client-target">{client.target_kcal ? Math.round(client.target_kcal) : '-'} kcal</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">Actividad</span>
                <span className="text-lg font-bold text-white font-heading capitalize" data-testid="client-activity">{client.activity_level.replace('_', ' ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Diets Section */}
        <div className="rounded-none border border-zinc-800 bg-black p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide">
              Dietas
            </h2>
            <Button
              onClick={() => navigate(`/clients/${id}/diet/new`)}
              className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12 transition-transform active:scale-95"
              data-testid="create-diet-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Dieta
            </Button>
          </div>

          {diets.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              No hay dietas creadas para este cliente
            </div>
          ) : (
            <>
              {/* Histó Rico de Calorías */}
              {diets.length > 1 && (
                <div className="mb-6 p-4 rounded-none border border-zinc-800 bg-zinc-950/30">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-zinc-400" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Histórico de Calorías</h3>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {diets.slice().reverse().map((diet, idx) => {
                      const maxKcal = Math.max(...diets.map(d => d.total_kcal));
                      const height = (diet.total_kcal / maxKcal) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div 
                            className="w-full bg-zinc-700 hover:bg-zinc-600 transition-colors rounded-t-sm relative group"
                            style={{ height: `${height}%` }}
                          >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                              {Math.round(diet.total_kcal)} kcal
                            </div>
                          </div>
                          <span className="text-xs text-zinc-600 truncate w-full text-center">
                            {new Date(diet.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lista de Dietas */}
              <div className="space-y-4">
                {diets.map((diet) => (
                  <div
                    key={diet.id}
                    className="rounded-none border border-zinc-800 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-colors"
                    data-testid={`diet-item-${diet.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white font-heading" data-testid="diet-name">{diet.name}</h3>
                          <span className="text-xs text-zinc-500">
                            {new Date(diet.created_at).toLocaleString('es-ES', { 
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-zinc-400">
                          <span data-testid="diet-kcal" className="font-mono">Kcal: {Math.round(diet.total_kcal)}</span>
                          <span data-testid="diet-protein" className="font-mono">P: {Math.round(diet.total_protein)}g</span>
                          <span data-testid="diet-carbs" className="font-mono">C: {Math.round(diet.total_carbs)}g</span>
                          <span data-testid="diet-fats" className="font-mono">G: {Math.round(diet.total_fats)}g</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => navigate(`/clients/${id}/diet/${diet.id}/preview`)}
                          variant="ghost"
                          className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                          data-testid="preview-diet-button"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Vista Previa
                        </Button>
                        <Button
                          onClick={() => handleExportPDF(diet.id)}
                          variant="ghost"
                          className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                          data-testid="export-pdf-button"
                        >
                          <FileDown className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="rounded-none hover:bg-red-900 text-red-400 hover:text-red-200 uppercase tracking-wider text-xs"
                              data-testid="delete-diet-button"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none bg-zinc-900 border-zinc-800">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white font-heading uppercase">¿Eliminar dieta?</AlertDialogTitle>
                              <AlertDialogDescription className="text-zinc-400">
                                Esta acción no se puede deshacer.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-none border-zinc-700 bg-transparent text-white hover:bg-zinc-800">Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteDiet(diet.id)} className="rounded-none bg-red-600 text-white hover:bg-red-700">
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDetail;
