import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FiliaisModule } from './filiais/filiais.module';
import { RolloutModule } from './rollout/rollout.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { PriorizacaoModule } from './priorizacao/priorizacao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FiliaisModule,
    RolloutModule,
    RelatorioModule,
    PriorizacaoModule,
  ],
})
export class AppModule {}
