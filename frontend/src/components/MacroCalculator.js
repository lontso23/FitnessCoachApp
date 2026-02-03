import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RefreshCw, Calculator, CheckCircle2 } from 'lucide-react';

export const MacroCalculator = ({ 
  editData, 
  setEditData, 
  macroMode, 
  setMacroMode,
  macroGrams,
  setMacroGrams,
  handleRecalculate 
}) => {
  const [autoAdjusted, setAutoAdjusted] = useState(false);

  // Mostrar mensaje de auto-ajuste por 2 segundos
  useEffect(() => {
    if (autoAdjusted) {
      const timer = setTimeout(() => setAutoAdjusted(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [autoAdjusted]);

  // Calcular gramos desde porcentajes
  const calculateGramsFromPercentages = (targetKcal, proteinPct, carbsPct, fatsPct) => {
    const proteinKcal = (targetKcal * proteinPct) / 100;
    const carbsKcal = (targetKcal * carbsPct) / 100;
    const fatsKcal = (targetKcal * fatsPct) / 100;

    return {
      protein: Math.round(proteinKcal / 4),
      carbs: Math.round(carbsKcal / 4),
      fats: Math.round(fatsKcal / 9)
    };
  };

  // Actualizar porcentaje y auto-ajustar otros
  const updatePercentage = (macro, value) => {
    const newValue = parseFloat(value) || 0;
    let newProtein = editData.protein_percentage;
    let newCarbs = editData.carbs_percentage;
    let newFats = editData.fats_percentage;

    if (macro === 'protein') {
      newProtein = newValue;
      // Ajustar otros dos proporcionalmente
      const remaining = 100 - newValue;
      const currentTotal = editData.carbs_percentage + editData.fats_percentage;
      if (currentTotal > 0) {
        newCarbs = (editData.carbs_percentage / currentTotal) * remaining;
        newFats = (editData.fats_percentage / currentTotal) * remaining;
      } else {
        newCarbs = remaining / 2;
        newFats = remaining / 2;
      }
    } else if (macro === 'carbs') {
      newCarbs = newValue;
      const remaining = 100 - newValue;
      const currentTotal = editData.protein_percentage + editData.fats_percentage;
      if (currentTotal > 0) {
        newProtein = (editData.protein_percentage / currentTotal) * remaining;
        newFats = (editData.fats_percentage / currentTotal) * remaining;
      } else {
        newProtein = remaining / 2;
        newFats = remaining / 2;
      }
    } else if (macro === 'fats') {
      newFats = newValue;
      const remaining = 100 - newValue;
      const currentTotal = editData.protein_percentage + editData.carbs_percentage;
      if (currentTotal > 0) {
        newProtein = (editData.protein_percentage / currentTotal) * remaining;
        newCarbs = (editData.carbs_percentage / currentTotal) * remaining;
      } else {
        newProtein = remaining / 2;
        newCarbs = remaining / 2;
      }
    }

    setEditData({
      ...editData,
      protein_percentage: Math.round(newProtein * 10) / 10,
      carbs_percentage: Math.round(newCarbs * 10) / 10,
      fats_percentage: Math.round(newFats * 10) / 10
    });
    
    setAutoAdjusted(true);
  };

  // Actualizar gramos y recalcular todo
  const updateGrams = (macro, value) => {
    const newValue = parseFloat(value) || 0;
    const newGrams = { ...macroGrams, [macro]: newValue };
    
    // Calcular kcal totales
    const proteinKcal = newGrams.protein * 4;
    const carbsKcal = newGrams.carbs * 4;
    const fatsKcal = newGrams.fats * 9;
    const totalKcal = proteinKcal + carbsKcal + fatsKcal;

    // Calcular porcentajes
    const proteinPct = totalKcal > 0 ? (proteinKcal / totalKcal) * 100 : 0;
    const carbsPct = totalKcal > 0 ? (carbsKcal / totalKcal) * 100 : 0;
    const fatsPct = totalKcal > 0 ? (fatsKcal / totalKcal) * 100 : 0;

    setMacroGrams(newGrams);
    setEditData({
      ...editData,
      protein_percentage: Math.round(proteinPct * 10) / 10,
      carbs_percentage: Math.round(carbsPct * 10) / 10,
      fats_percentage: Math.round(fatsPct * 10) / 10,
      target_kcal: Math.round(totalKcal)
    });

    setAutoAdjusted(true);
  };

  // Cambiar a modo gramos
  const switchToGramsMode = () => {
    if (editData.target_kcal) {
      const grams = calculateGramsFromPercentages(
        editData.target_kcal,
        editData.protein_percentage,
        editData.carbs_percentage,
        editData.fats_percentage
      );
      setMacroGrams(grams);
    }
    setMacroMode('grams');
  };

  // Calcular gramos actuales para mostrar en modo porcentaje
  const displayGrams = macroMode === 'percentage' && editData.target_kcal 
    ? calculateGramsFromPercentages(
        editData.target_kcal,
        editData.protein_percentage || 0,
        editData.carbs_percentage || 0,
        editData.fats_percentage || 0
      )
    : macroGrams;

  return (
    <div className="space-y-6">
      {/* Auto-adjusted notification */}
      {autoAdjusted && (
        <div className="flex items-center gap-2 p-3 bg-green-950/30 border border-green-900/50 rounded-none animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">✓ Cambios aplicados automáticamente</span>
        </div>
      )}

      {/* Botón Recalcular TMB */}
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
          type="button"
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
          type="button"
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
          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-none">
            <p className="text-xs text-blue-300">
              ℹ️ Al cambiar un porcentaje, los demás se ajustan automáticamente para sumar 100%
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Proteínas (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editData.protein_percentage || 0}
                onChange={(e) => updatePercentage('protein', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">{displayGrams.protein}g</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Carbohidratos (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editData.carbs_percentage || 0}
                onChange={(e) => updatePercentage('carbs', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">{displayGrams.carbs}g</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grasas (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={editData.fats_percentage || 0}
                onChange={(e) => updatePercentage('fats', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">{displayGrams.fats}g</p>
            </div>
          </div>
          <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-none">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total:</span>
              <span className="text-lg font-bold text-white font-heading">
                {Math.round((editData.protein_percentage || 0) + (editData.carbs_percentage || 0) + (editData.fats_percentage || 0))}%
              </span>
            </div>
          </div>
        </>
      ) : (
        /* Modo Gramos */
        <>
          <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-none">
            <p className="text-xs text-blue-300">
              ℹ️ Las kcal objetivo se ajustan automáticamente según los gramos ingresados
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Proteínas (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.protein}
                onChange={(e) => updateGrams('protein', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">
                {Math.round(macroGrams.protein * 4)} kcal ({editData.protein_percentage ? editData.protein_percentage.toFixed(1) : 0}%)
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Carbohidratos (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.carbs}
                onChange={(e) => updateGrams('carbs', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">
                {Math.round(macroGrams.carbs * 4)} kcal ({editData.carbs_percentage ? editData.carbs_percentage.toFixed(1) : 0}%)
              </p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Grasas (g)</Label>
              <Input
                type="number"
                step="1"
                value={macroGrams.fats}
                onChange={(e) => updateGrams('fats', e.target.value)}
                className="rounded-none border-zinc-800 bg-zinc-950/50 h-12 text-center text-lg font-bold"
              />
              <p className="text-xs text-zinc-600 mt-1 text-center font-mono">
                {Math.round(macroGrams.fats * 9)} kcal ({editData.fats_percentage ? editData.fats_percentage.toFixed(1) : 0}%)
              </p>
            </div>
          </div>
          <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-none">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-400">Total calculado:</span>
              <span className="text-2xl font-bold text-white font-heading">
                {Math.round(editData.target_kcal)} kcal
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
