import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RefreshCw, Calculator } from 'lucide-react';

export const MacroCalculator = ({ 
  editData, 
  setEditData, 
  macroMode, 
  setMacroMode,
  macroGrams,
  updateMacroGrams,
  switchToGramsMode,
  handleRecalculate 
}) => {
  
  const calculated Grams = macroMode === 'percentage' && editData.target_kcal ? {
    protein: Math.round((editData.target_kcal * editData.protein_percentage / 100) / 4),
    carbs: Math.round((editData.target_kcal * editData.carbs_percentage / 100) / 4),
    fats: Math.round((editData.target_kcal * editData.fats_percentage / 100) / 9)
  } : macroGrams;

  return (
    <div className="space-y-6">
      {/* Botón Recalcular */}
      <div className="flex items-center justify-between p-4 bg-zinc-950/50 rounded-none border border-zinc-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Calculadora de Macros
          </h3>
          <p className="text-xs text-zinc-500 mt-1">Recalcula TMB y kcal automáticamente según datos actuales</p>
        </div>
        <Button
          onClick={handleRecalculate}
          variant="ghost"
          className="rounded-none hover:bg-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider text-xs"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Recalcular TMB
        </Button>
      </div>

      {/* Switcher Modo */}
      <div className="flex gap-2">
        <Button
          onClick={() => setMacroMode('percentage')}
          variant={macroMode === 'percentage' ? 'default' : 'ghost'}
          className={`rounded-none flex-1 ${
            macroMode === 'percentage' 
              ? 'bg-white text-black hover:bg-zinc-200' 
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          Por Porcentaje (%)
        </Button>
        <Button
          onClick={switchToGramsMode}
          variant={macroMode === 'grams' ? 'default' : 'ghost'}
          className={`rounded-none flex-1 ${
            macroMode === 'grams' 
              ? 'bg-white text-black hover:bg-zinc-200' 
              : 'hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          Por Gramos (g)
        </Button>
      </div>

      {macroMode === 'percentage' ? (
        /* Modo Porcentaje */
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">% Proteínas</Label>
              <Input
                type="number"
                step="1"
                value={editData.protein_percentage || 0}
                onChange={(e) => setEditData({ ...editData, protein_percentage: parseFloat(e.target.value) || 0 })}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">{calculatedGrams.protein}g</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">% Carbohidratos</Label>
              <Input
                type="number"
                step="1"
                value={editData.carbs_percentage || 0}
                onChange={(e) => setEditData({ ...editData, carbs_percentage: parseFloat(e.target.value) || 0 })}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">{calculatedGrams.carbs}g</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">% Grasas</Label>
              <Input
                type="number"
                step="1"
                value={editData.fats_percentage || 0}
                onChange={(e) => setEditData({ ...editData, fats_percentage: parseFloat(e.target.value) || 0 })}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">{calculatedGrams.fats}g</p>
            </div>
          </div>
          {(editData.protein_percentage + editData.carbs_percentage + editData.fats_percentage !== 100) && (
            <p className="text-yellow-500 text-sm">⚠️ Los porcentajes deben sumar 100%</p>
          )}
        </>
      ) : (
        /* Modo Gramos */
        <>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Proteínas (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.protein}
                onChange={(e) => updateMacroGrams('protein', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">
                {Math.round(macroGrams.protein * 4)} kcal ({editData.protein_percentage ? editData.protein_percentage.toFixed(1) : 0}%)
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Carbohidratos (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.carbs}
                onChange={(e) => updateMacroGrams('carbs', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">
                {Math.round(macroGrams.carbs * 4)} kcal ({editData.carbs_percentage ? editData.carbs_percentage.toFixed(1) : 0}%)
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grasas (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.fats}
                onChange={(e) => updateMacroGrams('fats', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center">
                {Math.round(macroGrams.fats * 9)} kcal ({editData.fats_percentage ? editData.fats_percentage.toFixed(1) : 0}%)
              </p>
            </div>
          </div>
          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-none">
            <p className="text-sm text-blue-300">
              <strong>Total calculado:</strong> {Math.round(editData.target_kcal)} kcal
            </p>
            <p className="text-xs text-blue-400 mt-1">
              Las kcal objetivo se ajustan automáticamente según los gramos ingresados
            </p>
          </div>
        </>
      )}
    </div>
  );
};
