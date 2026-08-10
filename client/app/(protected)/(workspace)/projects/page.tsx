"use client";

import ProjectCard from "@/features/(workspace)/projects/components/ProjectCard";
import ProjectsPageSkeleton from "@/features/(workspace)/projects/components/ProjectsPageSkeleton";
import ProjectsToolbar from "@/features/(workspace)/projects/components/ProjectsToolbar";
import useProjectPage from "@/features/(workspace)/projects/hooks/useProjectPage";

const ProjectsPage = () => {
  const { state, actions } = useProjectPage();

  if (state.isLoading) {
    return <ProjectsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ProjectsToolbar
        query={state.query}
        filter={state.filter}
        canCreateProject={state.canCreateProject}
        onQueryChange={actions.setQuery}
        onFilterChange={actions.setFilter}
      />

      {state.totalCount === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects have been created in this organization yet.
        </p>
      ) : state.projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No projects match your search or filters.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              effectiveStatus={state.getEffectiveJoinRequestStatus(
                project.id,
                project.joinRequestStatus,
              )}
              isRequestingJoin={state.requestingProjectId === project.id}
              onRequestJoin={() => actions.requestJoin(project.id)}
              onOpen={() => actions.openProject(project)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
