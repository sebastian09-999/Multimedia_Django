import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Create a realistic fire extinguisher inventory and inspection log for Popayán
np.random.seed(42)

edificios = [
    "Alcaldía Municipal - Sede Central (CAM)",
    "Hospital Universitario San José",
    "Complejo Deportivo Villa Olímpica",
    "Plaza de Mercado Barrio Bolívar",
    "Estación Central de Bomberos Popayán",
    "Casa de la Cultura - Centro Histórico",
    "Terminal de Transportes de Popayán",
    "Colegio Mayor del Cauca - Sede Pambío",
    "Centro de Salud María Occidente",
    "Biblioteca Pública Departamental"
]

agentes = [
    ("ABC - Polvo Químico Seco", [10, 15, 20]),
    ("CO2 - Dióxido de Carbono", [5, 10, 15]),
    ("Agua Presurizada (AP)", [2.5, 10]),
    ("Solkaflam 123 / HFC-236fa", [3.700, 5, 10]),
    ("Acetato de Potasio (Clase K)", [6, 10])
]

areas_por_edificio = {
    "Alcaldía Municipal - Sede Central (CAM)": ["Piso 1 - Recepción y Servicio al Ciudadano", "Piso 2 - Despacho del Alcalde", "Piso 3 - Secretaría de Planeación", "Sótano - Archivo General"],
    "Hospital Universitario San José": ["Urgencias - Pasillo A", "Unidad de Cuidados Intensivos (UCI)", "Laboratorio Clínico", "Planta Eléctrica de Emergencia", "Piso 3 - Quirófanos"],
    "Complejo Deportivo Villa Olímpica": ["Coliseo Mayor - Zona de Graderías", "Cancha Sintética - Camerinos", "Oficinas Administrativas", "Gimnasio de Alto Rendimiento"],
    "Plaza de Mercado Barrio Bolívar": ["Sector Carnes y Lácteos", "Sector Granos y Abarrotes", "Oficina de Administración", "Bodega Principal de Carga"],
    "Estación Central de Bomberos Popayán": ["Garaje de Vehículos M1-M4", "Sala de Máquinas y Telecomunicaciones", "Dormitorios de Guardia", "Taller de Mantenimiento"],
    "Casa de la Cultura - Centro Histórico": ["Salón de Exposiciones Principal", "Auditorio Central", "Archivo Histórico de Documentos", "Oficinas Administrativas"],
    "Terminal de Transportes de Popayán": ["Hall Principal de Tiquetes", "Zona de Abordaje de Busetas", "Local Comercial 12 - Pasillo B", "Plataforma de Despacho"],
    "Colegio Mayor del Cauca - Sede Pambío": ["Laboratorio de Informática 1", "Biblioteca General", "Auditorio Institucional", "Cafetería Estudiantil"],
    "Centro de Salud María Occidente": ["Sala de Espera Urgencias", "Consultorio Triage", "Farmacia y Depósito de Medicamentos", "Área de Odontología"],
    "Biblioteca Pública Departamental": ["Sala Infantil y Lectura", "Hemeroteca General", "Oficina de Cómputo", "Depósito de Libros Raros"]
}

inspectores = [
    "Ing. Andrés Felipe Gómez (HSE)",
    "Téc. María Fernanda Valencia",
    "Sgt. Juan Carlos Mosquera (Bomberos Popayán)",
    "Ing. Diana Marcela Burbano",
    "Insp. Roberto Antonio Muñoz"
]

data = []
ext_id_counter = 101

# Generating 32 records
for ed in edificios:
    areas = areas_por_edificio[ed]
    for area in areas:
        ext_id = f"EXT-POP-{ext_id_counter}"
        ext_id_counter += 1
        
        # Select agent and capacity
        ag_tipo, cap_opts = agentes[np.random.choice(len(agentes), p=[0.45, 0.25, 0.10, 0.10, 0.10])]
        capacidad = np.random.choice(cap_opts)
        
        # Dates around late 2025 - 2026
        base_recarga = datetime(2025, 1, 1) + timedelta(days=int(np.random.randint(0, 300)))
        vencimiento = base_recarga + timedelta(days=365)
        ultima_insp = datetime(2026, 6, 1) + timedelta(days=int(np.random.randint(0, 90)))
        
        # Status determination based on dates
        is_expired = ultima_insp > vencimiento
        
        if is_expired:
            estado = np.random.choice(["Vencido - Requiere Recarga", "Fuera de Servicio"], p=[0.8, 0.2])
            presion = np.random.choice(["Baja - Zona Roja", "Cero"], p=[0.7, 0.3])
            pin = np.random.choice(["Intacto", "Faltante / Crotal Roto"], p=[0.6, 0.4])
            obs = "Mantenimiento inmediato requerido. Cilindro vencido o despresurizado."
        else:
            estado = np.random.choice(["Operativo", "Operativo", "Operativo", "Requiere Mantenimiento Menor"], p=[0.75, 0.15, 0.05, 0.05])
            presion = "Correcta - Zona Verde" if estado == "Operativo" else "Baja - Zona Verde Límite"
            pin = "Intacto"
            obs = "Extintor en óptimas condiciones de funcionamiento." if estado == "Operativo" else "Limpieza de manguera y reajuste de soporte requeridos."

        manguera = np.random.choice(["Buen Estado", "Buen Estado", "Fisura Menor", "Obstruida"], p=[0.85, 0.10, 0.03, 0.02])
        señal = np.random.choice(["Visible y Clara", "Visible y Clara", "Parcialmente Obstruida"], p=[0.9, 0.08, 0.02])
        altura = round(float(np.random.choice([1.10, 1.20, 1.30, 1.40, 1.50])), 2)
        inspector = np.random.choice(inspectores)
        
        data.append({
            "codigo_extintor": ext_id,
            "sede_edificio": ed,
            "ubicacion_especifica": area,
            "agente_extintor": ag_tipo,
            "capacidad_lbs": capacidad,
            "numero_serie": f"SN-2024-{np.random.randint(10000, 99999)}",
            "fecha_ultima_recarga": base_recarga.strftime("%Y-%m-%d"),
            "fecha_vencimiento_recarga": vencimiento.strftime("%Y-%m-%d"),
            "fecha_ultima_inspeccion": ultima_insp.strftime("%Y-%m-%d"),
            "presion_manometro": presion,
            "estado_general": estado,
            "manguera_boquilla": manguera,
            "pin_seguridad": pin,
            "senalizacion": señal,
            "altura_instalacion_m": altura,
            "inspector_responsable": inspector,
            "observaciones": obs
        })

df = pd.DataFrame(data)
df.to_csv("extintores.csv", index=False, encoding="utf-8-sig")
print("CSV file generated successfully with shape:", df.shape)
print(df.head(3))