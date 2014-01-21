from django.forms import ModelForm

from upload.models import Project


class ProjectForm(ModelForm):
    class Meta:
        model = Project
        fields = ('title', 'permission', 'organism', 'summary')
