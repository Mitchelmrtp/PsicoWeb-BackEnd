/**
 * DTO para pagos
 * Define la estructura de datos que se envía al frontend
 */

export class PagoDTO {
  constructor(pago) {
    this.id = pago.id;
    this.idSesion = pago.idSesion;
    this.idPaciente = pago.idPaciente;
    this.monto = parseFloat(pago.monto);
    this.montoImpuestos = parseFloat(pago.montoImpuestos);
    this.montoTotal = parseFloat(pago.montoTotal);
    this.metodoPago = pago.metodoPago;
    this.estado = pago.estado;
    this.transactionId = pago.transactionId;
    this.fechaPago = pago.fechaPago;
    this.descripcion = pago.descripcion;
    this.numeroComprobante = pago.numeroComprobante;
    this.createdAt = pago.created_at;
    this.updatedAt = pago.modified_at;
    
    // Incluir datos relacionados si están disponibles
    if (pago.sesion) {
      this.sesion = {
        id: pago.sesion.id,
        fecha: pago.sesion.fecha,
        horaInicio: pago.sesion.horaInicio,
        horaFin: pago.sesion.horaFin,
        estado: pago.sesion.estado
      };
    }
    
    if (pago.paciente) {
      this.paciente = {
        id: pago.paciente.id,
        nombre: pago.paciente.user?.name || `${pago.paciente.user?.first_name || ''} ${pago.paciente.user?.last_name || ''}`.trim()
      };
    }
  }
}

export class CreatePagoDTO {
  constructor(data) {
    this.idSesion = data.idSesion;
    this.idPaciente = data.idPaciente;
    this.monto = parseFloat(data.monto);
    this.montoImpuestos = parseFloat(data.montoImpuestos || 0);
    this.montoTotal = parseFloat(data.montoTotal);
    this.metodoPago = data.metodoPago;
    this.descripcion = data.descripcion;
    this.detallesPago = data.detallesPago;
  }
}

export class ComprobanteDTO {
  constructor(pago) {
    this.numeroComprobante = pago.numeroComprobante;
    this.fechaEmision = pago.fechaPago || pago.created_at;
    this.monto = parseFloat(pago.monto);
    this.montoImpuestos = parseFloat(pago.montoImpuestos);
    this.montoTotal = parseFloat(pago.montoTotal);
    this.metodoPago = pago.metodoPago;
    this.estado = pago.estado;
    this.descripcion = pago.descripcion;
    
    if (pago.sesion) {
      this.sesion = {
        fecha: pago.sesion.fecha,
        horaInicio: pago.sesion.horaInicio,
        horaFin: pago.sesion.horaFin
      };
    }
    
    if (pago.paciente && pago.paciente.user) {
      this.paciente = {
        nombre: pago.paciente.user.name || `${pago.paciente.user.first_name || ''} ${pago.paciente.user.last_name || ''}`.trim(),
        email: pago.paciente.user.email
      };
    }
  }
}
