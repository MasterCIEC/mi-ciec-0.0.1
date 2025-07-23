import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { GenericItem } from '../../types';
import Spinner from '../../components/Spinner';
import Modal from '../../components/Modal';
import { PlusIcon } from '../../components/icons/NavIcons';
import { CrudConfig, FormField, SelectData } from './types';

interface GenericCrudPageProps {
  config: CrudConfig;
}

const GenericCrudPage: React.FC<GenericCrudPageProps> = ({ config }) => {
  const { tableName, pageTitle, itemName, columns, formFields, selects, join, unique_column, unique_composite_columns } = config;

  const [items, setItems] = useState<GenericItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GenericItem | null>(null);
  const [formData, setFormData] = useState<Partial<GenericItem>>({});
  const [selectOptions, setSelectOptions] = useState<Record<string, SelectData[]>>({});

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase.from(tableName).select(join ? `*, ${join}` : '*').order('id');
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      setError(`Error al cargar ${itemName}s: ${fetchError.message}`);
      console.error(fetchError);
    } else {
      setItems(data as GenericItem[]);
    }
    setLoading(false);
  }, [tableName, itemName, join]);

  const fetchSelectOptions = useCallback(async () => {
    if (!selects) return;
    const allOptions: Record<string, SelectData[]> = {};
    for (const key in selects) {
      const { tableName, key: optionKey, value: optionValue } = selects[key];
      const { data, error } = await supabase.from(tableName).select(`${optionKey}, ${optionValue}`);
      if (!error && data) {
        allOptions[key] = data.map(d => ({ id: d[optionKey], name: d[optionValue] }));
      }
    }
    setSelectOptions(allOptions);
  }, [selects]);
  
  useEffect(() => {
    fetchItems();
    fetchSelectOptions();
  }, [fetchItems, fetchSelectOptions]);
  
  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  const handleOpenModal = (item: GenericItem | null = null) => {
    setEditingItem(item);
    setFormData(item || {});
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const requiredField = formFields.find(f => f.required && !formData[f.name]);
    if (requiredField) {
      alert(`El campo "${requiredField.label}" es obligatorio.`);
      return;
    }
    
    // Frontend validation for unique constraints
    let query = null;
    if (unique_column && formData[unique_column]) {
        query = supabase.from(tableName).select('id', { count: 'exact' }).eq(unique_column, formData[unique_column]);
    } else if (unique_composite_columns) {
        const allCompositeKeysPresent = unique_composite_columns.every(col => formData[col] != null && formData[col] !== '');
        if (allCompositeKeysPresent) {
            let validationQuery = supabase.from(tableName).select('id', { count: 'exact' });
            unique_composite_columns.forEach(col => {
                validationQuery = validationQuery.eq(col, formData[col]!);
            });
            query = validationQuery;
        }
    }

    if (query) {
         if (editingItem) {
            query = query.neq('id', editingItem.id);
        }
        const { data: existing, error: existingError } = await query.limit(1);
        if (existingError) {
            setError(`Error de validación: ${existingError.message}`);
            return;
        }
        if (existing && existing.length > 0) {
            setError("Error: Ya existe un registro con estos valores. Por favor, verifique los datos.");
            return;
        }
    }

    // Convert numeric string values from selects back to numbers before saving
    const dataToSave = { ...formData };
    formFields.forEach(field => {
        if (field.type === 'select' && dataToSave[field.name]) {
            const value = dataToSave[field.name];
            if (typeof value === 'string' && /^\d+$/.test(value)) {
                dataToSave[field.name] = parseInt(value, 10);
            }
        }
    });

    const { error: submitError } = editingItem
      ? await supabase.from(tableName).update(dataToSave).eq('id', editingItem.id)
      : await supabase.from(tableName).insert([dataToSave]);

    if (submitError) {
      if (submitError.message.includes('duplicate key') || submitError.message.includes('violates unique constraint')) {
        setError("Error: Ya existe un registro con estos valores. Por favor, verifique los datos.");
      } else {
        setError(`Error al guardar: ${submitError.message}`);
      }
    } else {
      handleCloseModal();
      fetchItems();
    }
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar este ${itemName}?`)) {
      const { error: deleteError } = await supabase.from(tableName).delete().eq('id', id);
      if (deleteError) {
        alert(`Error al eliminar: ${deleteError.message}`);
      } else {
        fetchItems();
      }
    }
  };

  if (loading) return <Spinner />;
  if (error && !isModalOpen) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-ciec-text">{pageTitle}</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-ciec-blue hover:bg-ciec-gold text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          <span>Añadir {itemName}</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-ciec-gray border-b-2 border-gray-200">
            <tr>
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 font-bold text-ciec-text uppercase tracking-wider">{col.header}</th>
              ))}
              <th className="px-4 py-3 font-bold text-ciec-text uppercase tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap text-ciec-dark-gray">
                    {getNestedValue(item, col.key) || 'N/A'}
                  </td>
                ))}
                <td className="px-4 py-3 whitespace-nowrap text-center space-x-2">
                  <button onClick={() => handleOpenModal(item)} className="text-ciec-blue hover:text-ciec-gold font-medium">Editar</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 font-medium">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center py-8 text-ciec-dark-gray">No se encontraron {itemName}s.</p>}
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`${editingItem ? 'Editar' : 'Crear'} ${itemName}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
          {formFields.map(field => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-ciec-dark-gray">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] as string | number || ''}
                  onChange={handleChange}
                  required={field.required}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ciec-blue focus:border-ciec-blue sm:text-sm"
                >
                  <option value="">Seleccione una opción</option>
                  {(selectOptions[field.name] || []).map(option => (
                    <option key={option.id} value={option.id}>{option.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name] as string | number || ''}
                  onChange={handleChange}
                  required={field.required}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-ciec-blue focus:border-ciec-blue sm:text-sm"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={handleCloseModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-6 rounded-lg hover:bg-gray-300">
              Cancelar
            </button>
            <button type="submit" className="bg-ciec-blue hover:bg-ciec-gold text-white font-bold py-2 px-6 rounded-lg">
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GenericCrudPage;