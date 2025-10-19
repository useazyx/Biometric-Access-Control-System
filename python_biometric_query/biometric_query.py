import sys
import json
from biometric_service import BiometricQueryService

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("NAO") # Indica erro ou uso incorreto
        sys.exit(1)

    template_base64 = sys.argv[1]
    finger_type = sys.argv[2]

    try:
        # Simulação temporária para teste de integração
        if template_base64 == "SIMULATED_GRANTED_TEMPLATE":
            print("SIM")
        elif template_base64 == "SIMULATED_DENIED_TEMPLATE":
            print("NAO")
        else:
            # Se não for um template simulado, ainda pode usar o serviço real
            service = BiometricQueryService()
            result = service.process_biometric_query(template_base64, finger_type)
            
            if result.get("access_granted"):
                print("SIM")
            else:
                print("NAO")
            
    except Exception as e:
        # Logar o erro para depuração, mas retornar NAO para o C++
        # Em um sistema real, você pode querer um log mais robusto
        print("NAO")
        sys.exit(1)

