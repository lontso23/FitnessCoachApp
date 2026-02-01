import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Users, Plus, Search, LogOut, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Dashboard = () => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      setClients(response.data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950" data-testid="dashboard-page">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold uppercase tracking-tight text-white font-heading">
            Lontso Fitness
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">Hola, <span className="text-white font-semibold">{user?.name}</span></span>
            <Button
              onClick={() => navigate('/foods')}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
              data-testid="foods-button"
            >
              <Database className="w-4 h-4 mr-2" />
              Alimentos
            </Button>
            <Button
              onClick={logout}
              variant="ghost"
              className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto p-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-none border border-zinc-800 bg-zinc-950/50 p-6 flex flex-col justify-between hover:border-zinc-700 transition-colors" data-testid="total-clients-stat">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Total Clientes</span>
              <Users className="w-5 h-5 text-zinc-600" />
            </div>
            <div className="text-4xl font-bold text-white font-heading">{clients.length}</div>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              type="text"
              placeholder="Buscar cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
              data-testid="search-input"
            />
          </div>
          <Button
            onClick={() => navigate('/clients/new')}
            className="rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide px-8 h-12 transition-transform active:scale-95"
            data-testid="add-client-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Clients Table */}
        <div className="rounded-none border border-zinc-800 bg-black overflow-hidden">
          <table className="w-full" data-testid="clients-table">
            <thead>
              <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase font-bold tracking-wider">
                <th className="text-left py-3 px-4">Nombre</th>
                <th className="text-left py-3 px-4">Edad</th>
                <th className="text-left py-3 px-4">Sexo</th>
                <th className="text-left py-3 px-4">Peso (kg)</th>
                <th className="text-left py-3 px-4">TMB</th>
                <th className="text-left py-3 px-4">Kcal Objetivo</th>
                <th className="text-left py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-zinc-500">
                    Cargando...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-zinc-500">
                    No se encontraron clientes
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-zinc-900 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    data-testid={`client-row-${client.id}`}
                  >
                    <td className="py-3 px-4 text-white font-medium">{client.name}</td>
                    <td className="py-3 px-4 text-zinc-400">{client.age}</td>
                    <td className="py-3 px-4 text-zinc-400">{client.sex === 'H' ? 'Hombre' : 'Mujer'}</td>
                    <td className="py-3 px-4 text-zinc-400">{client.weight}</td>
                    <td className="py-3 px-4 text-zinc-400">{client.tmb ? Math.round(client.tmb) : '-'}</td>
                    <td className="py-3 px-4 text-zinc-400">{client.target_kcal ? Math.round(client.target_kcal) : '-'}</td>
                    <td className="py-3 px-4">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/clients/${client.id}`);
                        }}
                        variant="ghost"
                        size="sm"
                        className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
                      >
                        Ver
                      </Button>
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

export default Dashboard;
