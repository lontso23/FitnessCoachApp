import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ClientForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    sex: 'H',
    weight: '',
    height: '',
    activity_level: 'moderada',
    protein_percentage: 30,
    carbs_percentage: 40,
    fats_percentage: 30
  });

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`);
      setFormData(response.data);
    } catch (error) {
      toast.error('Error al cargar cliente');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        await axios.put(`${API_URL}/clients/${id}`, formData);
        toast.success('Cliente actualizado');
      } else {
        await axios.post(`${API_URL}/clients`, formData);
        toast.success('Cliente creado');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="client-form-page">
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
            {id ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h1>
        </div>
      </header>

      <main className="max-w-[800px] mx-auto p-8">
        <form onSubmit={handleSubmit} className="space-y-6" data-testid="client-form">
          <div className="rounded-none border border-zinc-800 bg-black p-6">
            <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide mb-6">
              Datos Personales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nombre Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="name-input"
                />
              </div>

              <div>
                <Label htmlFor="age" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  required
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="age-input"
                />
              </div>

              <div>
                <Label htmlFor="sex" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Sexo</Label>
                <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                  <SelectTrigger className="rounded-none border-zinc-800 bg-zinc-950/50 h-12" data-testid="sex-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none bg-zinc-900 border-zinc-800">
                    <SelectItem value="H">Hombre</SelectItem>
                    <SelectItem value="M">Mujer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="weight" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  required
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="weight-input"
                />
              </div>

              <div>
                <Label htmlFor="height" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                  required
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="height-input"
                />
              </div>

              <div>
                <Label htmlFor="activity" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Nivel de Actividad</Label>
                <Select value={formData.activity_level} onValueChange={(value) => setFormData({ ...formData, activity_level: value })}>
                  <SelectTrigger className="rounded-none border-zinc-800 bg-zinc-950/50 h-12" data-testid="activity-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none bg-zinc-900 border-zinc-800">
                    <SelectItem value="sedentaria">Sedentaria</SelectItem>
                    <SelectItem value="ligera">Ligera</SelectItem>
                    <SelectItem value="moderada">Moderada</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="muy_alta">Muy Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-none border border-zinc-800 bg-black p-6">
            <h2 className="text-xl font-semibold text-white font-heading uppercase tracking-wide mb-6">
              Distribución de Macronutrientes (%)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="protein" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Proteínas</Label>
                <Input
                  id="protein"
                  type="number"
                  value={formData.protein_percentage}
                  onChange={(e) => setFormData({ ...formData, protein_percentage: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="protein-input"
                />
              </div>

              <div>
                <Label htmlFor="carbs" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Carbohidratos</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={formData.carbs_percentage}
                  onChange={(e) => setFormData({ ...formData, carbs_percentage: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="carbs-input"
                />
              </div>

              <div>
                <Label htmlFor="fats" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grasas</Label>
                <Input
                  id="fats"
                  type="number"
                  value={formData.fats_percentage}
                  onChange={(e) => setFormData({ ...formData, fats_percentage: parseFloat(e.target.value) })}
                  className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                  data-testid="fats-input"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide h-12 transition-transform active:scale-95"
            data-testid="submit-button"
          >
            {loading ? 'Guardando...' : (id ? 'Actualizar Cliente' : 'Crear Cliente')}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default ClientForm;
