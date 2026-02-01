import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ArrowLeft, Edit, Trash2, Plus, FileDown, Eye, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
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
            <div className="space-y-4">
              {diets.map((diet) => (
                <div
                  key={diet.id}
                  className="rounded-none border border-zinc-800 bg-zinc-950/50 p-4 hover:border-zinc-700 transition-colors"
                  data-testid={`diet-item-${diet.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white font-heading" data-testid="diet-name">{diet.name}</h3>
                      <div className="flex gap-6 mt-2 text-sm text-zinc-400">
                        <span data-testid="diet-kcal">Kcal: {Math.round(diet.total_kcal)}</span>
                        <span data-testid="diet-protein">P: {Math.round(diet.total_protein)}g</span>
                        <span data-testid="diet-carbs">C: {Math.round(diet.total_carbs)}g</span>
                        <span data-testid="diet-fats">G: {Math.round(diet.total_fats)}g</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleExportPDF(diet.id)}
                        variant="ghost"
                        className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                        data-testid="export-pdf-button"
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Exportar PDF
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
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDetail;
