import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { FiliaisModule } from './filiais/filiais.module';
import { RolloutModule } from './rollout/rollout.module';
import { RelatorioModule } from './relatorio/relatorio.module';
import { PriorizacaoModule } from './priorizacao/priorizacao.module';
import { MediasSemanaisModule } from './medias-semanais/medias-semanais.module';
import { LatenciasSemanaisModule } from './latencias-semanais/latencias-semanais.module';
import { MelhoriasModule } from './melhorias/melhorias.module';
import { VersaoModule } from './versao/versao.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    FiliaisModule,
    RolloutModule,
    RelatorioModule,
    PriorizacaoModule,
    MediasSemanaisModule,
    LatenciasSemanaisModule,
    MelhoriasModule,
    VersaoModule,
  ],
})
export class AppModule {}
