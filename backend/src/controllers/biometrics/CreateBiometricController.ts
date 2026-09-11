/**
 * CreateBiometricController.ts - Cuida do cadastro de digitais no sistema
 * # Pra que serve?
 * - Processa as requisições pra salvar uma nova digital
 * - Gerencia as respostas (sucesso ou erro) do processo
 * Feito por: Arthur Roberto Weege Pontes
 * Versão: 1.4.0
 * Data: 2025-06-15 (Finalizado)
 * Alterações:
 * - v1.0.0 (2025-06-01): Cadastro básico de digitais
 * - v1.1.0 (2025-06-05): Validação de qualidade da digital
 * - v1.2.0 (2025-06-08): Suporte a múltiplos dispositivos
 * - v1.3.0 (2025-06-12): Limite de digitais por pessoa
 * - v1.4.0 (2025-06-15): Integração com sistema de auditoria
 */

import { FastifyReply, FastifyRequest } from "fastify";
import { CreateBiometricService } from "../../services/biometrics/CreateBiometricService";
import { Finger } from "@prisma/client";

// Cuida da parte de cadastrar digitais (aquela hora que o usuário coloca o dedo no leitor)
export class CreateBiometricController {
  // Processa o pedido de cadastro de uma nova digital (rota que o dispositivo biométrico chama)

  async handle(request: FastifyRequest, reply: FastifyReply) {
    // Pega os dados do corpo da requisição:
    const { cpf, template, finger, unit_code } = request.body as {
      cpf: string;
      template: string;
      finger: Finger;
      unit_code: string;
    };

    try {
      // Manda o serviço salvar a digital no banco de dados
      const service = new CreateBiometricService();
      const biometric = await service.execute(cpf, template, finger, unit_code);

      // Se deu tudo certo, monta a resposta bonitinha pro front
      // Os campos vão SOLTOS, não aninhados num "biometric": é assim que o schema
      // da rota declara a resposta. Aninhado, o Fastify falhava ao serializar e
      // devolvia 500 mesmo com a digital já gravada no banco.
      return reply.status(201).send({
        id: biometric.id,
        message: "Digital cadastrada com sucesso! 👌",
        person_id: biometric.person_id,
        finger: biometric.finger,
        // O schema declara datetime como TEXTO: mandar o Date cru quebra a serialização
        created_at: biometric.created_at.toISOString(),
      });
    } catch (error: any) {
      // Se deu erro, vê qual foi e manda a resposta adequada
      switch (error.message) {
        case "Pessoa não encontrada":
          // CPF não bate com ninguém no sistema
          return reply.status(404).send({
            error: error.message,
            solution: "Confere aí esse CPF, não encontramos ninguém com ele",
          });
        case "Unidade não encontrada":
          // Código da unidade tá errado
          return reply.status(404).send({
            error: error.message,
            solution: "Verifica o código da unidade, tá certo?",
          });
        case "Já existe biometria cadastrada para este dedo":
          // Tentou cadastrar o mesmo dedo duas vezes
          return reply.status(409).send({
            error: error.message,
            solution:
              "Esse dedo já tá cadastrado! Escolhe outro ou apaga o anterior",
          });
        default:
          // Qualquer outro erro que a gente não esperava
          return reply.status(400).send({
            error: "Opa, deu ruim no cadastro da digital",
            details: error.message,
          });
      }
    }
  }
}
