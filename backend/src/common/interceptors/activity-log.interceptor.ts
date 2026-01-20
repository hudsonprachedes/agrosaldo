import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';

function getClientIp(req: any): string {
  const xff = req?.headers?.['x-forwarded-for'];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  const ip = (
    typeof raw === 'string' && raw.length ? raw.split(',')[0] : req?.ip
  )?.trim?.();
  return String(ip ?? req?.socket?.remoteAddress ?? '').replace(/^::ffff:/, '');
}

@Injectable()
export class ActivityLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    const url = String(req?.originalUrl ?? req?.url ?? '');
    if (
      url.includes('/api/admin/atividade') ||
      url.includes('/api/admin/auditoria') ||
      url.includes('/api/swagger') ||
      url.includes('/api/health')
    ) {
      return next.handle();
    }

    const now = Date.now();
    const method = String(req?.method ?? '').toUpperCase();
    const route = url;

    const userId = req?.user?.id ? String(req.user.id) : null;
    const userName =
      typeof req?.user?.name === 'string' && req.user.name.length
        ? req.user.name
        : null;

    const ip = getClientIp(req);

    const evento = `${method} ${route}`;

    const activityDelegate = (this.prisma as any).logAtividade;
    if (!activityDelegate || typeof activityDelegate.create !== 'function') {
      return next.handle();
    }

    const writeOk = async (statusCode: number) => {
      try {
        await activityDelegate.create({
          data: {
            usuarioId: userId,
            usuarioNome: userName,
            evento,
            status: 'ok',
            metodo: method,
            rota: route,
            codigoHttp: statusCode,
            duracaoMs: Date.now() - now,
            ip,
          },
        });
      } catch {
        return;
      }
    };

    const writeError = async (statusCode: number, err: any) => {
      const message =
        typeof err?.message === 'string'
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Erro';

      try {
        await activityDelegate.create({
          data: {
            usuarioId: userId,
            usuarioNome: userName,
            evento,
            status: 'erro',
            detalhes: message,
            metodo: method,
            rota: route,
            codigoHttp: statusCode,
            duracaoMs: Date.now() - now,
            ip,
            metadata: {
              name: err?.name,
            },
          },
        });
      } catch {
        return;
      }
    };

    return next.handle().pipe(
      tap(() => {
        const res = http.getResponse();
        const code = Number(res?.statusCode ?? 200);
        writeOk(code).catch(); // Fire and forget
      }),
      catchError((err) => {
        const res = http.getResponse();
        const code = Number(res?.statusCode ?? err?.status ?? 500);
        void writeError(code, err);
        return throwError(() => err);
      }),
    );
  }
}
