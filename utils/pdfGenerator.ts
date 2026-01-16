import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Operation, Supervisor, Location, Resource } from '../types';

export const PdfGenerator = {
  generateDailyReport: (
    groupedOperations: Record<string, Operation[]>, 
    supervisors: Supervisor[], 
    locations: Location[], 
    resources: Resource[],
    reportDate: string
  ) => {
    // FIX: The custom `jsPDFWithAutoTable` interface was causing type errors.
    // The `doc` is a standard jsPDF instance, and `autoTable` is used as a function.
    const doc = new jsPDF();
    
    // --- 1. Filter Data for the Selected Date ---
    const reportData = Object.values(groupedOperations).map(group => {
      const primaryOp = group[0];
      const realizedVolumesToday = group.flatMap(op => op.volumes || [])
        .filter(v => v.isDelivered && v.deliveryDate === reportDate);
      
      if (realizedVolumesToday.length === 0) return null;

      const location = locations.find(l => l.id === primaryOp.locationId);
      const supervisor = supervisors.find(s => s.id === primaryOp.supervisorId);
      
      const area = primaryOp.applicationArea || primaryOp.productionArea || 0;
      const recommendedRate = primaryOp.applicationFlowRate || 0;
      const realizedVolume = realizedVolumesToday.reduce((sum, v) => sum + v.liters, 0);
      const appliedRate = area > 0 ? realizedVolume / area : 0;
      
      const deviation = recommendedRate > 0 ? ((appliedRate / recommendedRate) - 1) * 100 : 0;
      const status = Math.abs(deviation) > 10 ? '⚠️' : '✅'; // Deviation threshold of 10%

      return {
        location,
        supervisor,
        products: group.map(op => resources.find(r => r.id === op.resourceId)?.name || op.resourceId).join(', '),
        area,
        recommendedRate,
        appliedRate,
        status,
        deviation
      };
    }).filter((d): d is NonNullable<typeof d> => d !== null);

    if (reportData.length === 0) {
      alert(`Nenhuma operação com cargas entregues encontrada para a data ${new Date(reportDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
      return;
    }

    // --- 2. Header ---
    doc.setFontSize(18);
    doc.text('Relatório Diário de Aplicação de Calda', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Data do Relatório: ${new Date(reportDate + 'T00:00:00').toLocaleDateString('pt-BR')}`, 14, 30);
    doc.text('Empresa: Usina Smart', 145, 22);
    
    // --- 3. Summary Box ---
    const totalSectors = new Set(reportData.map(d => d.location?.id)).size;
    const totalArea = reportData.reduce((sum, d) => sum + d.area, 0);
    const totalVolume = reportData.reduce((sum, d) => sum + (d.appliedRate * d.area), 0);
    const totalDeviations = reportData.filter(d => d.status === '⚠️').length;

    const summaryText = `Total de setores aplicados: ${totalSectors}\nÁrea total (ha): ${totalArea.toFixed(2)}\nVolume total de calda (L): ${totalVolume.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}\nAplicações fora do padrão: ${totalDeviations}`;
    doc.setFontSize(10);
    doc.setDrawColor(224, 224, 224); // Light grey border
    doc.setFillColor(249, 250, 251); // Very light grey bg
    doc.roundedRect(14, 40, 182, 25, 3, 3, 'FD');
    doc.text(summaryText, 20, 46);

    // --- 4. Main Table ---
    const tableData = reportData.map(d => [
      d.location?.sectorName || '-',
      d.supervisor?.name || '-',
      d.products,
      d.area.toFixed(2),
      d.recommendedRate.toFixed(2),
      d.appliedRate.toFixed(2),
      d.status
    ]);
    
    autoTable(doc, {
      startY: 75,
      head: [['Setor', 'Encarregado', 'Produto(s)', 'Área (ha)', 'Vol. Rec. (L/ha)', 'Vol. Aplic. (L/ha)', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] } // sugar-green-600
    });

    // --- 5. Observations ---
    const deviationObservations = reportData
      .filter(d => d.status === '⚠️')
      .map(d => `- O setor ${d.location?.sectorName} apresentou volume ${d.deviation > 0 ? 'acima' : 'abaixo'} do recomendado (${d.deviation.toFixed(0)}%). Recomenda-se verificação.`);

    if (deviationObservations.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.setFontSize(12);
      doc.text('Observações do Sistema:', 14, finalY + 15);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(deviationObservations.join('\n'), 14, finalY + 22);
    }
    
    // --- 6. Footer ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, 14, 287);
      doc.text(`Página ${i} de ${pageCount}`, 180, 287);
    }
    
    // --- 7. Save PDF ---
    doc.save(`relatorio_diario_${reportDate}.pdf`);
  }
};