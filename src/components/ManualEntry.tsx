import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { X, Check } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LedgerEngine } from '../services/LedgerEngine';
import { useLedgerStore } from '../store/useLedgerStore';

export const ManualEntry = ({ onClose }: { onClose: () => void }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState('food');
  const [counterparty, setCounterparty] = useState('');
  
  const refreshLedger = useLedgerStore(state => state.refresh);

  const handleSave = async () => {
    if (!amount) return;
    
    await LedgerEngine.addEntry('manual', {
      amount: parseInt(amount) * 100, // Assuming cents
      type,
      category,
      counterparty: counterparty || undefined
    }, `Manual entry: ${amount} for ${category}`);
    
    refreshLedger();
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <MotiView from={{ translateY: 300 }} animate={{ translateY: 0 }} style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>New Transaction</Text>
          <TouchableOpacity onPress={onClose}><X color="#64748B" size={24} /></TouchableOpacity>
        </View>

        <ScrollView>
          <Text style={styles.label}>Amount</Text>
          <TextInput 
            style={styles.input} 
            placeholder="0.00" 
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]} 
              onPress={() => setType('expense')}
            >
              <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]} 
              onPress={() => setType('income')}
            >
              <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>Income</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Category</Text>
          <View style={styles.catGrid}>
            {['food', 'transport', 'supplies', 'utilities', 'other'].map(cat => (
              <TouchableOpacity 
                key={cat}
                style={[styles.catItem, category === cat && styles.catItemActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Paid To / From (Optional)</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Name or Store"
            value={counterparty}
            onChangeText={setCounterparty}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Check color="#FFF" size={24} />
            <Text style={styles.saveBtnText}>Save Transaction</Text>
          </TouchableOpacity>
        </ScrollView>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '80%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '800', color: '#1E293B' },
  label: { fontSize: 14, fontWeight: '700', color: '#64748B', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 18, fontWeight: '600', color: '#1E293B' },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center' },
  typeBtnActive: { backgroundColor: '#1E293B' },
  typeBtnText: { fontWeight: '700', color: '#64748B' },
  typeBtnTextActive: { color: '#FFF' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catItem: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  catItemActive: { backgroundColor: '#3B82F6' },
  catText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  catTextActive: { color: '#FFF' },
  saveBtn: { backgroundColor: '#10B981', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 12 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});
