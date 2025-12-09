# Script de Exportação em Lote - Todos os Baralhos

## Como usar:

1. Abra seu app no navegador (versão local ou online)
2. Pressione **F12** para abrir o DevTools
3. Vá para a aba **"Console"**
4. Cole o script abaixo e pressione **Enter**

---

## Script Robusto de Exportação (Cole no Console):

```javascript
(function() {
  try {
    // Lê todos os baralhos do LocalStorage
    const storageKey = 'flashcards_sets_v1';
    const rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
      console.warn('⚠️ Nenhum baralho encontrado no LocalStorage.');
      return;
    }

    const sets = JSON.parse(rawData);
    
    if (!Array.isArray(sets) || sets.length === 0) {
      console.warn('⚠️ Nenhum baralho válido encontrado.');
      return;
    }

    // Valida e limpa os dados antes de exportar
    const validSets = sets.filter(set => {
      if (!set || typeof set !== 'object') return false;
      if (!set.id || !set.title) return false;
      if (!Array.isArray(set.cards)) return false;
      return true;
    });

    if (validSets.length === 0) {
      console.error('❌ Nenhum baralho válido para exportar.');
      return;
    }

    // Prepara metadados da exportação
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      totalSets: validSets.length,
      sets: validSets
    };

    // Cria o arquivo JSON
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Gera nome do arquivo com data/hora
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `todos_baralhos_${timestamp}.json`;

    // Cria link de download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Limpeza
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 1000);

    // Feedback no console
    console.log(`✅ Exportação concluída!`);
    console.log(`📦 ${validSets.length} baralho(s) exportado(s)`);
    console.log(`📄 Arquivo: ${filename}`);
    console.log(`💾 Total de cards: ${validSets.reduce((sum, s) => sum + (s.cards?.length || 0), 0)}`);
    
    return { success: true, count: validSets.length, filename };
  } catch (error) {
    console.error('❌ Erro ao exportar baralhos:', error);
    alert('Erro ao exportar. Veja o console para detalhes.');
    return { success: false, error };
  }
})();
```

---

## O que o script faz:

✅ **Lê todos os baralhos** do LocalStorage  
✅ **Valida cada baralho** antes de exportar  
✅ **Adiciona metadados** (versão, data de exportação, total)  
✅ **Gera arquivo JSON** formatado e legível  
✅ **Faz download automático** com nome único (timestamp)  
✅ **Feedback completo** no console  
✅ **Tratamento de erros** robusto  

---

## Formato do arquivo exportado:

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "totalSets": 3,
  "sets": [
    {
      "id": "...",
      "title": "Pág 71",
      "category": "FORMA",
      "cards": [...],
      "createdAt": 1234567890,
      "lastStudied": null
    },
    ...
  ]
}
```

---

## Importação:

Após exportar, você pode importar o arquivo `.json` usando o botão **"Importar Baralho"** no Dashboard do app. O app agora aceita tanto arquivos com um único baralho quanto arquivos com múltiplos baralhos (array).

---

## Notas:

- O script é **seguro** e **não modifica** seus dados originais
- Funciona em qualquer navegador moderno
- O arquivo gerado é compatível com a função de importação do app
- Você pode executar o script quantas vezes quiser

